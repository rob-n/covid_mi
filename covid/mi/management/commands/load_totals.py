from django.core.management.base import BaseCommand
from mi.models import DateTotal


class Command(BaseCommand):
    help = 'Load totals into database'

    def handle(self, *args, **options):
        DateTotal.load_today_totals()
