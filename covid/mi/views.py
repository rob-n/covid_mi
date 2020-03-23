import datetime
import json

from django.db.models import Count
from django.shortcuts import render
from django.views import generic
from django.conf import settings
from django.core import serializers

# Create your views here.
from .models import Case


class IndexView(generic.ListView):
    template_name = 'mi/index.html'
    context_object_name = 'data'

    def get_queryset(self):
        path = settings.BASE_DIR + '/mi/data/michigan-counties.json'
        with open(path) as f:
            string_json = f.read()
        map_json = json.loads(string_json)
        # cases = Case.objects.filter(date=datetime.datetime.today()).values('county__county')\
        #     .annotate(total=Count('county__county'))
        cases = Case.objects.values('county__county') \
            .annotate(total=Count('county__county'))
        totals_dict = {x['county__county']: x['total'] for x in cases}
        dates = Case.objects.values_list('date').distinct()
        dates_list = [x[0].strftime('%m/%d') for x in dates]
        # json_cases = serializers.serialize('json', cases)
        context = {
            'cases': totals_dict,
            'map_json': map_json,
            'dates': dates_list
        }
        return context
