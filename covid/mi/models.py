import datetime
import os

import pandas as pd
import numpy as np

from django.db import models

# Create your models here.
from django.db.models import Sum


class County(models.Model):
    county = models.CharField(max_length=100, null=False)
    population = models.IntegerField()
    sq_mi = models.IntegerField()

    def __str__(self):
        return self.county

    @staticmethod
    def load_county_info():
        """
        Loads county information from csv file. Expects county name, population, and sq_ft area
        :return: True if successful
        """
        path = r'mi/data/counties.csv'
        with open(path) as f:
            data = f.readlines()
            for line in data[1:]:
                # remove new line character at end and set to title case
                county, population, sq_mi = line.replace('\n', '').split(',')
                try:
                    c = County.objects.get(county=county)
                    c.population = population
                    c.sq_mi = sq_mi
                    c.save()
                except BaseException as be:
                    c = County.objects.create(county=county, population=population, sq_mi=sq_mi)
                    c.save()
                    print(county)
                    print(be)
        return True

    def person_per_mi(self):
        """
        Divide population by square mile land coverage to get population density
        :return:
        """
        return round(self.population / self.sq_mi, 2)

    @staticmethod
    def total_population():
        """
        sums up population of all counties
        :return: total MI population
        """
        qs = County.objects.all().aggregate(total=Sum('population'))
        return qs['total']

    @staticmethod
    def total_area():
        """
        sums up sq_mi of all counties
        :return: total MI square mileage
        """
        qs = County.objects.all().aggregate(total=Sum('sq_mi'))
        return qs['total']


class DateTotal(models.Model):
    date = models.DateField()
    county = models.ForeignKey(to=County, on_delete=models.CASCADE)
    cases = models.IntegerField()
    deaths = models.IntegerField()

    def __str__(self):
        return f'{self.date} - {self.county} - {str(self.cases)} cases, {str(self.deaths)} deaths'

    @staticmethod
    def get_all_cases_and_deaths(county=None):
        """
        gets the total cases and deaths
        :param county: if populated, limits search to specific county
        :return: tuple of (cases, deaths)
        """
        if county:
            totals = DateTotal.objects.filter(county__county=county).aggregate(cases=Sum('cases'),
                                                                               deaths=Sum('deaths'))
        else:
            totals = DateTotal.objects.all().aggregate(cases=Sum('cases'), deaths=Sum('deaths'))

        return totals['cases'], totals['deaths']

    @staticmethod
    def cases_and_deaths_per_n(county=None, n=1000):
        """
        calculates total cases/deaths per n number of persons
        :param county: county to search for, defaults to None/aggregates all
        :param n: total persons, defaults to 1000
        :return: tuple of (cases per n, deaths per n)
        """
        cases, deaths = DateTotal.get_all_cases_and_deaths(county)
        if county:
            population = County.objects.get(county=county).population
        else:
            population = County.total_population()

        cases_per_n = round(cases / population * n, 2)
        deaths_per_n = round(deaths / population * n, 2)

        return cases_per_n, deaths_per_n

    @staticmethod
    def cases_and_deaths_per_sq_mi(county=None):
        """
        calculates total cases/deaths per square mile in the county
        :param county: county to search for
        :return: tuple of (cases per sq_mi, deaths per sq_mi)
        """
        cases, deaths = DateTotal.get_all_cases_and_deaths(county)
        if county:
            area = County.objects.get(county=county).sq_mi
        else:
            area = County.total_area()

        cases_per_sq_mi = round(cases / area, 2)
        deaths_per_sq_mi = round(deaths / area, 2)

        return cases_per_sq_mi, deaths_per_sq_mi

    @staticmethod
    def load_data_path(from_date: datetime.date = None):
        """
        Loads totals from csv file in data - data/date_totals.csv
        :param from_date: if populated, will only start adding cases >= specified date.
        :return: True if successful
        """
        if not from_date:
            from_date = datetime.date.today()
        path = r'../data/date_totals.csv'
        with open(path) as f:
            data = f.readlines()
            for line in data[1:]:
                # remove new line character at end and set to title case
                split_line = line.replace('\n', '').split(',')
                if from_date:
                    if datetime.datetime.strptime(split_line[0], '%Y-%m-%d').date() < from_date:
                        continue
                new_info = DateTotal.create(*split_line)
                new_info.save()
        return True

    @classmethod
    def base_dir(cls):
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    @staticmethod
    def get_today_totals():
        website = 'https://www.michigan.gov/coronavirus/0,9753,7-406-98163_98173---,00.html'
        df: pd.DataFrame = pd.read_html(website)[0]  # should be at least 2 tables; totals is first one
        today = datetime.date.today().strftime('%Y-%m-%d')
        # df = pd.DataFrame(np.row_stack([df.columns, df.values]), columns=['0', '1', '2'])
        # df = df[['date', '0', '1', '2']]
        df['date'] = today
        df.fillna(0, inplace=True)
        headers = ['date', 'County', 'Confirmed Cases', 'Reported Deaths']
        df = df[headers]
        # df.loc[0]['2'] = 0 if 'named' in df.loc[0]['2'] else df.loc[0]['2']  # no header rows any more
        df.to_csv(f'{os.path.join(DateTotal.base_dir())}/mi/data/totals/totals_{today}_raw.csv',
                  index=False, header=False)
        # yesterday = datetime.date.today() - datetime.timedelta(days=1)

        totals = DateTotal.objects.values('county__county')\
            .annotate(case_total=Sum('cases'), death_total=Sum('deaths'))

        totals_dict = {x['county__county']: {'cases': x['case_total'],
                                             'deaths': x['death_total']} for x in totals}
        new_dict = {}
        for i in df.index:
            county = df.at[i, headers[1]]
            county = DateTotal.clean_county(county)
            cases = df.at[i, headers[2]]
            deaths = df.at[i, headers[3]]
            if new_dict.get(county):
                new_dict[county]['cases'] = str(int(new_dict[county]['cases']) + int(cases))
                new_dict[county]['deaths'] = str(int(new_dict[county]['deaths']) + int(deaths))
            else:
                new_dict[county] = {'cases': cases, 'deaths': deaths}

        dates = []
        counties = []
        cases = []
        deaths = []
        for k, v in new_dict.items():
            if k.upper() == 'COUNTY':
                continue
            dates.append(today)
            counties.append(k)
            if totals_dict.get(k):
                case_count = int(v['cases']) - totals_dict[k]['cases']
                death_count = int(v['deaths']) - totals_dict[k]['deaths']
            else:
                case_count = int(v['cases'])
                death_count = int(v['deaths'])
            cases.append(case_count)
            deaths.append(death_count)

        data_dict = {'dates': dates, 'county': counties, 'cases': cases, 'deaths': deaths}
        data = pd.DataFrame(data_dict)

        data.to_csv(f'{DateTotal.base_dir()}/mi/data/totals/totals_{today}.csv', index=False)
        return True

    @staticmethod
    def clean_county(county):
        if county.upper() == 'OUT OF STATE':
            county = 'Non-MI'
        elif county.upper() == 'DETROIT CITY':
            county = 'Detroit'
        elif county.upper() == 'BAY COUNTY':
            county = 'Bay'
        elif county.upper()[:5] == 'OTHER':
            county = 'Unknown'
        elif 'JOSEPH' in county.upper():
            county = 'St. Joseph'
        elif 'CLAIR' in county.upper():
            county = 'St. Clair'
        elif 'MDOC' in county.upper():
            county = 'MDOC'
        elif 'FCI' in county.upper():
            county = 'FCI'
        return county

    @staticmethod
    def load_today_totals():
        today = datetime.date.today().strftime('%Y-%m-%d')
        path = f'{DateTotal.base_dir()}/mi/data/totals/totals_{today}.csv'
        with open(path) as f:
            data = f.readlines()
            for line in data[1:]:
                # remove new line character at end and set to title case
                split_line = line.replace('\n', '').split(',')
                county = split_line[1]
                if 'TOTAL' in county.upper():
                    continue
                county = DateTotal.clean_county(county)

                cases = split_line[2]
                deaths = split_line[3]

                new_info = DateTotal.create(date=today,
                                            county=county,
                                            cases=cases,
                                            deaths=deaths)
                new_info.save()
        return True

    @classmethod
    def create(cls, date, county, cases, deaths):
        """Convenience class to add a new DateTotal quickly. Does not save."""
        if County.objects.filter(county=county).exists():
            db_county = County.objects.get(county=county)
        else:
            new_county = County.objects.create(county=county, population=0, sq_mi=0)
            print('Created a new county:', county)
            new_county.save()
            db_county = County.objects.get(county=county)

        case = cls(
                date=date,
                county=db_county,
                cases=cases,
                deaths=deaths
                )
        return case


class Event(models.Model):
    entry_date = models.DateField(auto_now=True)
    eff_dt = models.DateTimeField()
    event_text = models.CharField(max_length=255)

    def __str__(self):
        return f'Effective {str(self.eff_dt)} - {self.event_text[:50]}{"..." if len(self.event_text) > 50 else ""}'
