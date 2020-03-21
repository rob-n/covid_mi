import datetime
from django.shortcuts import render
from django.views import generic

# Create your views here.
from .models import Case


class IndexView(generic.ListView):
    template_name = 'mi/index.html'
    context_object_name = 'data'

    def get_queryset(self):
        return Case.objects.filter(date=datetime.datetime.today())
