import datetime
import json

from django.db.models import Count
from django.shortcuts import render
from django.views import generic
from django.conf import settings
from django.core import serializers

from .models import Case


class IndexView(generic.ListView):
    template_name = 'mi/index.html'
    context_object_name = 'data'

    def get_queryset(self):
        path = settings.BASE_DIR + '/mi/data/michigan-counties.json'
        with open(path) as f:
            string_json = f.read()
        map_json = json.loads(string_json)
        date_cases = Case.objects.values('county__county', 'date')\
            .annotate(total=Count('county__county'))
        date_totals = {}
        for case in date_cases:
            case_date = case['date'].strftime('%m/%d')
            if not date_totals.get(case_date):
                date_totals[case_date] = {}
            date_totals[case_date][case['county__county']] = case['total']
        cases = Case.objects.values('county__county') \
            .annotate(total=Count('county__county'))
        totals_dict = {x['county__county']: x['total'] for x in cases}
        dates = Case.objects.values_list('date').distinct()
        dates_list = [x[0].strftime('%m/%d') for x in dates]
        # json_cases = serializers.serialize('json', cases)
        context = {
            'cases': totals_dict,
            'date_cases': date_totals,
            'map_json': map_json,
            'dates': dates_list
        }
        return context

    def post(self, request):
        data = json.loads(request.body)
        cases = Case.objects.filter(date__range=('2020-03-10', data['end_date']))\
            .values('county__county').annotate(total=Count('county__county'))
        totals_dict = {x['county__county']: x['total'] for x in cases}
        context = {
            'cases': totals_dict,
        }
        return context
