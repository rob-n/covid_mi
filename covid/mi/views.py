import datetime
import json

from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import render
from django.views import generic
from django.conf import settings
from django.core import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CaseSerializer
from .models import Case, Death


class IndexView(generic.ListView):
    template_name = 'mi/index.html'
    context_object_name = 'data'

    def get_queryset(self):
        path = settings.BASE_DIR + '/mi/data/michigan-counties.json'
        with open(path) as f:
            string_json = f.read()
        map_json = json.loads(string_json)
        case_count = Case.objects.all().count()
        death_count = Death.objects.all().count()
        dates = Case.objects.values_list('date').distinct()
        dates_list = [x[0].strftime('%m/%d') for x in dates]
        context = {
            'cases': case_count,
            'deaths': death_count,
            'map_json': map_json,
            'dates': dates_list
        }
        return context

    def post(self, request):
        data = json.loads(request.body)
        cases = Case.objects.filter(date__range=('2020-03-10', data['end_date']))\
            .values('county__county').annotate(total=Count('county__county'))
        totals_dict = {x['county__county']: x['total'] for x in cases}

        deaths = Death.objects.filter(date__range=('2020-03-10', data['end_date'])) \
            .values('county__county').annotate(total=Count('county__county'))
        death_dict = {x['county__county']: x['total'] for x in deaths}

        context = {
            'cases': totals_dict,
            'deaths': death_dict
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
            cases = Case.objects.filter(date=(request.data['end_date']))
            case_total = cases.count()
            cases = cases.values('county__county').annotate(total=Count('county__county'))

            deaths = Death.objects.filter(date=(request.data['end_date']))
            death_total = deaths.count()
            deaths = deaths.values('county__county').annotate(total=Count('county__county'))
        else:
            cases = Case.objects.filter(date__range=('2020-03-10', request.data['end_date']))
            case_total = cases.count()
            cases = cases.values('county__county').annotate(total=Count('county__county'))

            deaths = Death.objects.filter(date__range=('2020-03-10', request.data['end_date']))
            death_total = deaths.count()
            deaths = deaths.values('county__county').annotate(total=Count('county__county'))

        totals_dict = {x['county__county']: x['total'] for x in cases}
        death_dict = {x['county__county']: x['total'] for x in deaths}
        context = {
            'cases': totals_dict,
            'deaths': death_dict,
            'total_cases': case_total,
            'total_deaths': death_total
        }
        return JsonResponse(context)
