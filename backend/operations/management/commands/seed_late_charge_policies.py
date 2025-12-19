"""
Seed late charge policies with realistic examples for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
from operations.models import LateChargePolicy


User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample late charge policies'

    def handle(self, *args, **options):
        # Get or create an admin user
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@vestigo.local', 'is_staff': True}
        )

        policies = [
            {
                'name': '2% Monthly Late Fee',
                'description': 'Apply 2% of payment amount after 30 days overdue',
                'charge_type': LateChargePolicy.CHARGE_TYPE_PERCENTAGE,
                'charge_amount': Decimal('2.00'),
                'trigger_type': LateChargePolicy.TRIGGER_TYPE_DAYS_OVERDUE,
                'trigger_threshold': 30,
                'maximum_charge_per_payment': Decimal('500.00'),
                'is_active': True,
            },
            {
                'name': '$50 Flat Late Fee',
                'description': 'Flat $50 fee after 45 days overdue',
                'charge_type': LateChargePolicy.CHARGE_TYPE_FLAT,
                'charge_amount': Decimal('50.00'),
                'trigger_type': LateChargePolicy.TRIGGER_TYPE_DAYS_OVERDUE,
                'trigger_threshold': 45,
                'maximum_charge_per_payment': None,
                'is_active': True,
            },
            {
                'name': '5% Three Month Late Fee',
                'description': 'Apply 5% of payment after 3 months (90 days) overdue',
                'charge_type': LateChargePolicy.CHARGE_TYPE_PERCENTAGE,
                'charge_amount': Decimal('5.00'),
                'trigger_type': LateChargePolicy.TRIGGER_TYPE_DAYS_OVERDUE,
                'trigger_threshold': 90,
                'maximum_charge_per_payment': Decimal('1000.00'),
                'is_active': False,  # Inactive for now
            },
        ]

        created = 0
        skipped = 0

        for policy_data in policies:
            policy_name = policy_data['name']
            
            # Check if policy already exists
            if LateChargePolicy.objects.filter(name=policy_name).exists():
                self.stdout.write(self.style.WARNING(f'Skipped: {policy_name} (already exists)'))
                skipped += 1
            else:
                policy_data['created_by'] = admin_user
                LateChargePolicy.objects.create(**policy_data)
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {policy_name}'))
                created += 1

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Created: {created} policies'))
        if skipped > 0:
            self.stdout.write(self.style.WARNING(f'Skipped: {skipped} policies'))
        self.stdout.write('='*60)
