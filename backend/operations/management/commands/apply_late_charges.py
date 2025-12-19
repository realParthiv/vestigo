"""
Management command to automatically apply late charge policies to overdue payments.
This should be run daily as a scheduled task.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from operations.models import PremiumPayment, LateCharge, LateChargePolicy


class Command(BaseCommand):
    help = 'Apply active late charge policies to overdue payments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--policy-id',
            type=int,
            help='Apply specific policy ID (default: all active policies)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        policy_id = options.get('policy_id')
        today = timezone.now().date()
        created_count = 0
        skipped_count = 0

        # Get active policies
        if policy_id:
            policies = LateChargePolicy.objects.filter(id=policy_id, is_active=True)
        else:
            policies = LateChargePolicy.objects.filter(is_active=True)

        if not policies.exists():
            self.stdout.write(self.style.WARNING('No active policies found'))
            return

        self.stdout.write(f'Found {policies.count()} active late charge policies')

        # Find overdue payments without late charges
        overdue_payments = PremiumPayment.objects.filter(
            status=PremiumPayment.PAYMENT_STATUS_OVERDUE,
            late_charge__isnull=True
        ).select_related('policy')

        if not overdue_payments.exists():
            self.stdout.write(self.style.SUCCESS('No overdue payments found'))
            return

        self.stdout.write(f'Found {overdue_payments.count()} overdue payments without charges')

        for payment in overdue_payments:
            days_overdue = (today - payment.due_date).days
            self.stdout.write(f'\nProcessing {payment.payment_number} (overdue {days_overdue} days)')

            for policy in policies:
                charge_amount = policy.calculate_charge(payment, days_overdue)

                if charge_amount > 0:
                    if dry_run:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  DRY RUN: Would create charge of {charge_amount} '
                                f'from policy "{policy.name}"'
                            )
                        )
                        created_count += 1
                    else:
                        try:
                            LateCharge.objects.create(
                                payment=payment,
                                policy=payment.policy,
                                charge_policy=policy,
                                charge_amount=charge_amount,
                                reason=f'Late payment by {days_overdue} days'
                            )
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'  ✓ Created charge of {charge_amount} '
                                    f'from policy "{policy.name}"'
                                )
                            )
                            created_count += 1
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f'  ✗ Error creating charge: {str(e)}')
                            )
                else:
                    self.stdout.write(
                        f'  Skipped policy "{policy.name}" (threshold not met)'
                    )
                    skipped_count += 1

        # Summary
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.WARNING(f'DRY RUN - Would create: {created_count} charges'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✓ Created: {created_count} late charges'))
        
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count} policies (threshold not met)'))

        self.stdout.write('='*60)
