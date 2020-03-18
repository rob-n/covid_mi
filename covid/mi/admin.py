from django.contrib import admin
from mi.models import Age, ContactBool, Sex, County, Case, TravelType
# Register your models here.


class CountyAdmin(admin.ModelAdmin):
    ordering = ['county']


class SexAdmin(admin.ModelAdmin):
    ordering = ['sex']


class AgeAdmin(admin.ModelAdmin):
    ordering = ['age']


admin.site.register(Age, AgeAdmin)
admin.site.register(ContactBool)
admin.site.register(Sex, SexAdmin)
admin.site.register(County, CountyAdmin)
admin.site.register(Case)
admin.site.register(TravelType)
