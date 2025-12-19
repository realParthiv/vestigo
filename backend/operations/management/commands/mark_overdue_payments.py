from django.core.management.base import BaseCommand
from operations.models import PremiumPayment
from django.utils import timezone


class Command(BaseCommand):
    help = 'Mark pending/failed payments past due date as overdue'

    def handle(self, *args, **options):
        today = timezone.now().date()
        updated = PremiumPayment.objects.filter(
            status__in=[PremiumPayment.PAYMENT_STATUS_PENDING, PremiumPayment.PAYMENT_STATUS_FAILED],
            due_date__lt=today
        ).update(status=PremiumPayment.PAYMENT_STATUS_OVERDUE)
        
        self.stdout.write(self.style.SUCCESS(f'Marked {updated} payments as overdue'))
