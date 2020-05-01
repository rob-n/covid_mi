from django.contrib import admin
from mi.models import County, Event, DateTotal


# Register your models here.


class CountyAdmin(admin.ModelAdmin):
    ordering = ['county']


admin.site.register(County, CountyAdmin)
admin.site.register(Event)
admin.site.register(DateTotal)
