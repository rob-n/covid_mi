from django.core.management.base import BaseCommand
from mi.models import DateTotal


class Command(BaseCommand):
    help = 'Gets totals from MI website'

    def handle(self, *args, **options):
        DateTotal.get_today_totals()
