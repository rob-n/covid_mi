import datetime
import json

from django.db.models import Count, Max, Min, Sum, Q, Window, F
from django.http import JsonResponse
from django.shortcuts import render
from django.views import generic
from django.conf import settings
from django.core import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CaseSerializer
from .models import Case, Death, DateTotal, County


class IndexView(generic.ListView):
    template_name = 'mi/index.html'
    context_object_name = 'data'

    def get_queryset(self):
        path = settings.BASE_DIR + '/mi/data/michigan-counties.json'
        with open(path) as f:
            string_json = f.read()
        map_json = json.loads(string_json)
        sums = DateTotal.objects.all().aggregate(cases=Sum('cases'),
                                                 deaths=Sum('deaths'))
        case_count = sums['cases']
        death_count = sums['deaths']
        dates = DateTotal.objects.values_list('date').distinct()
        last_date = DateTotal.objects.aggregate(max_date=Max('date'))['max_date']
        min_date = DateTotal.objects.aggregate(min_date=Min('date'))['min_date']
        dates_list = [x[0].strftime('%Y-%m-%d') for x in dates]

        date_totals_qs = DateTotal.objects.values('date').annotate(cases=Sum('cases'),
                                                                   deaths=Sum('deaths'))

        date_totals = {x['date'].strftime('%Y-%m-%d'):
                           {'cases': x['cases'],
                            'deaths': x['deaths'],
                            'date': x['date'].strftime('%Y-%m-%d')}
                       for x in date_totals_qs}

        cum_sum = DateTotal.objects. \
            annotate(c_cases=Window(Sum('cases'), order_by=F('date').asc())) \
            .annotate(c_deaths=Window(Sum('deaths'), order_by=F('date').asc())) \
            .values('date', 'c_cases', 'c_deaths').order_by('date')

        c_date_totals = {x['date'].strftime('%Y-%m-%d'):
                             {'cases': x['c_cases'],
                              'deaths': x['c_deaths'],
                              'date': x['date'].strftime('%Y-%m-%d')} for x in cum_sum}

        all_counties = County.objects.values('county').order_by('county')
        counties = [x['county'] for x in all_counties]

        context = {
            'cases': case_count,
            'deaths': death_count,
            'map_json': map_json,
            'dates': dates_list,
            'last_date': last_date,
            'first_date': min_date,
            'date_totals': json.dumps(c_date_totals),
            'c_date_totals': json.dumps(date_totals),
            'counties': counties
        }
        return context


class CaseList(APIView):
    def get(self, request, format=None):
        context = {'request': request}
        case = Case.objects.all()
        serializer = CaseSerializer(case, many=True, context=context)
        return Response(serializer.data)

    def post(self, request, format=None):
        if request.data['date_type'] == 'date':
            totals = DateTotal.objects.filter(date=(request.data['end_date']))
        else:
            totals = DateTotal.objects.filter(date__range=('2020-03-10', request.data['end_date']))

        sums = totals.aggregate(cases=Sum('cases'), deaths=Sum('deaths'))
        case_total = sums['cases']
        cases = totals.values('county__county').annotate(total=Sum('cases'))

        deaths = totals.values('county__county').annotate(total=Sum('deaths'))
        death_total = sums['deaths']

        totals_dict = {x['county__county']: x['total'] for x in cases}
        death_dict = {x['county__county']: x['total'] for x in deaths}
        context = {
            'cases': totals_dict,
            'deaths': death_dict,
            'total_cases': case_total,
            'total_deaths': death_total
        }
        return JsonResponse(context)


class CountyGrowth(APIView):
    def get(self, request):
        county = request.data.get('county')
        cases = Case.objects.filter(county__county=county).values('date').annotate(total=Count('date'))
        case_dict = {x['date'].strftime('%m/%d'): x['total'] for x in cases}
        context = {
            'cases': case_dict
        }
        return JsonResponse(context)

    def post(self, request, format=None):
        if request.data['county'] == 'All':
            total_qs = DateTotal.objects.all()
        else:
            total_qs = DateTotal.objects.filter(county__county=request.data['county'])

        if request.data['date_type'] == 'date':
            date_totals_qs = total_qs.values('date').annotate(cases=Sum('cases'),
                                                              deaths=Sum('deaths'))

            totals = {x['date'].strftime('%Y-%m-%d'):
                          {'cases': x['cases'],
                           'deaths': x['deaths'],
                           'date': x['date'].strftime('%Y-%m-%d')}
                      for x in date_totals_qs}
        else:
            cum_sum = total_qs.annotate(c_cases=Window(Sum('cases'), order_by=F('date').asc())) \
                .annotate(c_deaths=Window(Sum('deaths'), order_by=F('date').asc())) \
                .values('date', 'c_cases', 'c_deaths').order_by('date')

            totals = {x['date'].strftime('%Y-%m-%d'):
                          {'cases': x['c_cases'],
                           'deaths': x['c_deaths'],
                           'date': x['date'].strftime('%Y-%m-%d')} for x in cum_sum}

        context = {
            'totals': json.dumps(totals)
        }
        return JsonResponse(context)
