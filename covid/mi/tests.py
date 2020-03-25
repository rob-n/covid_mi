import datetime

from django.test import TestCase, Client
from .models import Case, Age, County, Sex, ContactBool


class CaseModelTests(TestCase):
    def setUp(self) -> None:
        self.county = 'Washtenaw'
        self.from_date = datetime.date(2020, 3, 22)  # expect 3 cases in from_date count
        self.on_date = datetime.date(2020, 3, 23)  # expect 1 cases in on_date count
        junk_age = Age(1, 'Unknown')
        junk_age.save()
        junk_sex = Sex(1, 'Unknown')
        junk_sex.save()
        # junk_county = County(1, 'Washtenaw')
        # junk_county.save()
        junk_contact = ContactBool(1, 'Unknown')
        junk_contact.save()
        for i in range(5):
            test_case = Case.create(date=f'2020-03-2{str(i)}',
                                    county=self.county,
                                    age='Unknown',
                                    sex='Unknown',
                                    travel='Unknown',
                                    travel_type='',
                                    contact_origin='Unknown')
            test_case.save()

    def test_case_count(self):
        assert Case.county_count(self.county) == 5

    def test_case_count_from_date(self):
        assert Case.county_count(self.county, from_date=self.from_date) == 3

    def test_case_count_on_date(self):
        assert Case.county_count(self.county, on_date=self.on_date) == 1


class MainURLTest(TestCase):
    def setUp(self) -> None:
        self.home_url = '/'
        self.api_case_url = '/api/case/'
        self.api_death_url = '/api/death/'
        self.api_growth_url = '/api/growth/'

    def test_home(self):
        c = Client()
        response = c.get(self.home_url)
        assert response.status_code == 200

    def test_api_case_get(self):
        c = Client()
        response = c.get(self.api_case_url)
        assert response.status_code == 200

    def test_api_case_post(self):
        c = Client()
        response = c.post(self.api_case_url, {'date_type': '', 'end_date': '2020-03-24'})
        assert response.status_code == 200

    def test_api_growth_get(self):
        c = Client()
        response = c.get(self.api_growth_url)
        assert response.status_code == 200

    def test_api_death_get(self):
        c = Client()
        response = c.get(self.api_death_url)
        assert response.status_code == 200

    def test_api_death_post(self):
        c = Client()
        response = c.post(self.api_death_url, {'date_type': '', 'end_date': '2020-03-24'})
        assert response.status_code == 200
