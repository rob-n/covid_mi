import datetime

from django.db import models

# Create your models here.


class County(models.Model):
    county = models.CharField(max_length=100, null=False)

    def __str__(self):
        return self.county


class Sex(models.Model):
    sex = models.CharField(max_length=15, null=False)

    def __str__(self):
        return self.sex


class Age(models.Model):
    age = models.CharField(max_length=25, null=False)

    def __str__(self):
        return self.age


class TravelType(models.Model):
    travel_type = models.CharField(max_length=100, default='Unknown', null=True)

    def __str__(self):
        return self.travel_type


class ContactBool(models.Model):
    contact_origin = models.CharField(max_length=20, default='Unknown')

    def __str__(self):
        return self.contact_origin


class Case(models.Model):
    date = models.DateField()
    county = models.ForeignKey(to=County, on_delete=models.CASCADE)
    age = models.ForeignKey(to=Age, on_delete=models.CASCADE)
    sex = models.ForeignKey(to=Sex, on_delete=models.CASCADE)
    travel = models.BooleanField(null=True)
    travel_type = models.ForeignKey(to=TravelType, null=True, on_delete=models.CASCADE)
    contact_origin = models.ForeignKey(to=ContactBool, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.date.strftime("%Y/%m/%d")} - {self.county} - {self.sex}'

    @staticmethod
    def county_count(county: str, from_date: datetime.date = None, on_date: datetime.date = None):
        """
        Gets the total number of cases from a specific county. If looking for a specific date,
        from_date will aggregate the total from a specific date going forward, while on_date will
        get the total cases in that county on a specific date.

        :param county: county to get total cases of, string of county name
        :param from_date: optional date to start count from
        :param on_date: optional date to get total amount on
        :return: total count of cases in a specific county (optionally filtered by date)
        """
        if from_date:
            total = Case.objects.filter(county__county=county).filter(date__gte=from_date).count()
        elif on_date:
            total = Case.objects.filter(county__county=county).filter(date=on_date).count()
        else:
            total = Case.objects.filter(county__county=county).count()
        return total

    @staticmethod
    def load_data_path(from_index=1, from_date: datetime.date = None):
        """
        Loads cases from csv file in data directory (data/mi_cases.csv)
        :param from_index: index to start at. Initial one offset due to headers.
        :param from_date: if populated, will only start adding cases >= specified date.
        :return: True if successful
        """
        path = r'../data/mi_cases.csv'
        with open(path) as f:
            data = f.readlines()
            for line in data[from_index:]:
                # remove new line character at end and set to title case
                split_line = line.replace('\n', '').split(',')
                cleaned = [x.title() for x in split_line]
                if from_date:
                    if datetime.datetime.strptime(cleaned[0], '%Y-%m-%d').date() < from_date:
                        continue
                new_case = Case.create(*cleaned)
                new_case.save()
        return True

    @classmethod
    def create(cls, date, county, age, sex, travel, travel_type, contact_origin):
        """Convenience class to add a new Case quickly. Does not save."""
        if County.objects.filter(county=county).exists():
            db_county = County.objects.get(county=county)
        else:
            new_county = County.objects.create(county=county)
            new_county.save()
            db_county = County.objects.get(county=county)

        if travel == 'Unknown':
            travel = None
        elif travel == 'Yes':
            travel = True
        else:
            travel = False

        case = cls(
                date=date,
                county=db_county,
                age=Age.objects.get(age=age),
                sex=Sex.objects.get(sex=sex),
                travel=travel,
                travel_type=TravelType.objects.get(travel_type=travel_type) if travel_type else None,
                contact_origin=ContactBool.objects.get(contact_origin=contact_origin)
                )
        return case


class Death(models.Model):
    date = models.DateField()
    county = models.ForeignKey(to=County, on_delete=models.CASCADE)
    high_risk = models.BooleanField(null=True, default=None)
    high_risk_type = models.CharField(max_length=500, blank=True, default='')

    def __str__(self):
        return f'{self.date.strftime("%Y/%m/%d")} - {self.county} -' \
               f' {self.high_risk} - {self.high_risk_type}'

    @staticmethod
    def load_data_path(from_index=1, from_date: datetime.date = None):
        """
        Loads deaths from csv file in data directory (data/mi_deaths.csv)
        :param from_index: index to start at. Initial one offset due to headers.
        :param from_date: if populated, will only start adding cases >= specified date.
        :return: True if successful
        """
        path = r'../data/mi_deaths.csv'
        with open(path) as f:
            data = f.readlines()
            for line in data[from_index:]:
                # remove new line character at end and set to title case
                split_line = line.replace('\n', '').split(',')
                if from_date:
                    if datetime.datetime.strptime(split_line[0], '%Y-%m-%d').date() < from_date:
                        continue
                new_death = Death.create(*split_line)
                new_death.save()
        return True

    @classmethod
    def create(cls, date, county, high_risk, high_risk_type):
        death = cls(date=date, county=County.objects.get(county=county),
                    high_risk=high_risk, high_risk_type=high_risk_type)
        return death


class Event(models.Model):
    entry_date = models.DateField(auto_now=True)
    eff_dt = models.DateTimeField()
    event_text = models.CharField(max_length=255)

    def __str__(self):
        return f'Effective {str(self.eff_dt)} - {self.event_text[:50]}{"..." if len(self.event_text) > 50 else ""}'
