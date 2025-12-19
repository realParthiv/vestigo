from django.core.management.base import BaseCommand
from django.db import transaction
from operations.models import Policy, PremiumPayment, LateCharge
from claims.models import Claim
from bdm.models import Lead, Opportunity
from underwriting.models import Submission
from notifications.models import Notification
from reconciliation.models import BankStatement, BankLine


class Command(BaseCommand):
    help = 'Clear all operational data while preserving users, roles, and configuration (late charge policies)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of all operational data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL operational data (policies, claims, leads, etc.)\n'
                    'Users, roles, and late charge policies will be preserved.\n\n'
                    'Run with --confirm to proceed:\n'
                    'python manage.py clear_operational_data --confirm'
                )
            )
            return

        self.stdout.write(self.style.WARNING('Starting data deletion...'))

        try:
            with transaction.atomic():
                # Delete in order to respect foreign key constraints
                
                # 1. Delete reconciliation data
                bank_lines = BankLine.objects.all().delete()
                self.stdout.write(f'Deleted {bank_lines[0]} bank lines')
                
                bank_statements = BankStatement.objects.all().delete()
                self.stdout.write(f'Deleted {bank_statements[0]} bank statements')
                
                # 2. Delete notifications
                notifications = Notification.objects.all().delete()
                self.stdout.write(f'Deleted {notifications[0]} notifications')
                
                # 3. Delete late charges (keep policies though)
                late_charges = LateCharge.objects.all().delete()
                self.stdout.write(f'Deleted {late_charges[0]} late charges')
                
                # 4. Delete claims
                claims = Claim.objects.all().delete()
                self.stdout.write(f'Deleted {claims[0]} claims')
                
                # 5. Delete premium payments
                payments = PremiumPayment.objects.all().delete()
                self.stdout.write(f'Deleted {payments[0]} premium payments')
                
                # 6. Delete policies
                policies = Policy.objects.all().delete()
                self.stdout.write(f'Deleted {policies[0]} policies')
                
                # 7. Delete underwriting submissions
                submissions = Submission.objects.all().delete()
                self.stdout.write(f'Deleted {submissions[0]} underwriting submissions')
                
                # 8. Delete opportunities
                opportunities = Opportunity.objects.all().delete()
                self.stdout.write(f'Deleted {opportunities[0]} opportunities')
                
                # 9. Delete leads
                leads = Lead.objects.all().delete()
                self.stdout.write(f'Deleted {leads[0]} leads')
                
                self.stdout.write(
                    self.style.SUCCESS(
                        '\n✓ All operational data deleted successfully!\n'
                        'Preserved: Users, Roles, Late Charge Policies\n'
                        'You can now test a fresh policy lifecycle.'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during deletion: {str(e)}')
            )
            raise
