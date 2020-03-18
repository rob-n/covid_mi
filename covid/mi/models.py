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


class TravelBool(models.Model):
    travel = models.CharField(max_length=20, default='Unknown')

    def __str__(self):
        return self.travel


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
    travel = models.ForeignKey(to=TravelBool, on_delete=models.CASCADE)
    travel_type = models.ForeignKey(to=TravelType, null=True, on_delete=models.CASCADE)
    contact_origin = models.ForeignKey(to=ContactBool, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.date.strftime("%Y/%m/%d")} - {self.county} - {self.sex}'

    @classmethod
    def create(cls, date, county, age, sex, travel, travel_type, contact_origin):
        case = cls(
                date=date,
                county=County.objects.get(county=county),
                age=Age.objects.get(age=age),
                sex=Sex.objects.get(sex=sex),
                travel=TravelBool.objects.get(travel=travel),
                travel_type=TravelType.objects.get(travel_type=travel_type) if travel_type else None,
                contact_origin=ContactBool.objects.get(contact_origin=contact_origin)
                )
        return case


