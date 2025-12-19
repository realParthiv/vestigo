"""
Django Management Command: seed_demo_data
Creates realistic demo data for all models in the Vestigo system.
Usage: python manage.py seed_demo_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role
from bdm.models import Lead, Opportunity, Activity
from underwriting.models import Submission
from operations.models import Policy, PremiumPayment
from claims.models import Claim
from notifications.models import Notification
from datetime import date, timedelta
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed demo data for all Vestigo models'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting demo data seeding...'))
        
        # Create roles if they don't exist
        roles_data = [
            ('ADMIN', 'System Administrator'),
            ('BDM', 'Business Development Manager'),
            ('UNDERWRITER', 'Underwriting Specialist'),
            ('OPERATIONS', 'Operations Manager'),
            ('CLAIMS', 'Claims Processor'),
            ('FINANCE', 'Finance Officer'),
            ('VIEWER', 'Read-only Viewer'),
        ]
        
        roles = {}
        for name, desc in roles_data:
            role, created = Role.objects.get_or_create(name=name, defaults={'description': desc})
            roles[name] = role
            if created:
                self.stdout.write(f'  Created role: {name}')
        
        # Create demo users (one per role)
        users = {}
        user_configs = [
            ('admin', 'admin@vestigo.com', 'ADMIN', True),
            ('bdm', 'bdm@vestigo.com', 'BDM', False),
            ('underwriter', 'underwriter@vestigo.com', 'UNDERWRITER', False),
            ('operations', 'operations@vestigo.com', 'OPERATIONS', False),
            ('claims', 'claims@vestigo.com', 'CLAIMS', False),
            ('finance', 'finance@vestigo.com', 'FINANCE', False),
        ]
        
        for username, email, role_name, is_staff in user_configs:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': roles[role_name],
                    'is_staff': is_staff,
                    'is_active': True,
                    'first_name': username.capitalize(),
                    'last_name': 'User'
                }
            )
            if created:
                user.set_password('password123')  # Default password for demo
                user.save()
                self.stdout.write(f'  Created user: {username} (password: password123)')
            users[role_name] = user
        
        # Create demo leads
        leads_data = [
            ('John', 'Doe', 'john.doe@techcorp.com', 'TechCorp Inc', '+1234567890', 'NEW'),
            ('Jane', 'Smith', 'jane.smith@healthplus.com', 'HealthPlus Ltd', '+1987654321', 'QUALIFIED'),
            ('Bob', 'Johnson', 'bob@manufacturing.com', 'Johnson Manufacturing', '+1122334455', 'CONTACTED'),
            ('Alice', 'Williams', 'alice@retailgroup.com', 'Retail Group Co', '+1555666777', 'QUALIFIED'),
            ('Charlie', 'Brown', 'charlie@logistics.com', 'Fast Logistics', '+1444555666', 'NEW'),
        ]
        
        leads = []
        for first, last, email, company, phone, status in leads_data:
            lead, created = Lead.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'company_name': company,
                    'phone': phone,
                    'status': status,
                    'source': random.choice(['WEBSITE', 'REFERRAL', 'COLD_CALL']),
                    'assigned_to': users['BDM']
                }
            )
            if created:
                leads.append(lead)
                self.stdout.write(f'  Created lead: {company}')
        
        # Create opportunities from qualified leads
        opportunities = []
        for lead in leads[:3]:  # First 3 leads
            opp, created = Opportunity.objects.get_or_create(
                lead=lead,
                defaults={
                    'name': f'{lead.company_name} - Group Insurance',
                    'stage': random.choice(['DISCOVERY', 'QUOTE', 'NEGOTIATION']),
                    'expected_revenue': Decimal(random.randint(5000, 50000)),
                    'assigned_to': users['BDM'],
                    'expected_close_date': date.today() + timedelta(days=random.randint(30, 90))
                }
            )
            if created:
                opportunities.append(opp)
                self.stdout.write(f'  Created opportunity: {opp.name}')
        
        # Create submissions from opportunities
        submissions = []
        for opp in opportunities[:2]:  # First 2 opportunities
            sub, created = Submission.objects.get_or_create(
                opportunity=opp,
                defaults={
                    'status': random.choice(['PENDING', 'APPROVED']),
                    'risk_score': random.randint(30, 85),
                    'submitted_premium': Decimal(random.randint(5000, 50000)),
                    'notes': 'Standard commercial risk profile. 12-month policy with quarterly premium payments.',
                    'underwriter': users.get('UNDERWRITER')
                }
            )
            if created:
                submissions.append(sub)
                self.stdout.write(f'  Created submission for {opp.name}')
        
        # Create policies from approved submissions
        policies = []
        for sub in [s for s in submissions if s.status == 'APPROVED']:
            policy_number = f'POL-{random.randint(100000, 999999)}'
            policy_type = random.choice(['HEALTH', 'AUTO', 'LIFE', 'HOME'])
            premium_amount = Decimal(random.randint(5000, 50000))
            policy, created = Policy.objects.get_or_create(
                policy_number=policy_number,
                defaults={
                    'customer': sub.opportunity.lead,
                    'policy_type': policy_type,
                    'premium_amount': premium_amount,
                    'start_date': date.today() + timedelta(days=random.randint(1, 30)),
                    'end_date': date.today() + timedelta(days=365),
                    'status': 'ACTIVE'
                }
            )
            if created:
                policies.append(policy)
                self.stdout.write(f'  Created policy: {policy_number}')
                
                # Create premium payments for this policy
                num_payments = random.choice([4, 12])  # Quarterly or Monthly
                installment = premium_amount / num_payments
                
                for i in range(num_payments):
                    due_date = policy.start_date + timedelta(days=i * (365 // num_payments))
                    payment_number = f'PAY-{policy.policy_number}-{i+1:02d}'
                    
                    # First payment is paid, second is overdue, rest pending
                    if i == 0:
                        status = 'PAID'
                        paid_date = due_date
                        amount_paid = installment
                    elif i == 1:
                        status = 'OVERDUE'
                        paid_date = None
                        amount_paid = Decimal('0.00')
                    else:
                        status = 'PENDING'
                        paid_date = None
                        amount_paid = Decimal('0.00')
                    
                    PremiumPayment.objects.get_or_create(
                        payment_number=payment_number,
                        defaults={
                            'policy': policy,
                            'amount_due': installment,
                            'due_date': due_date,
                            'status': status,
                            'paid_date': paid_date,
                            'amount_paid': amount_paid,
                            'payment_method': 'BANK_TRANSFER' if status == 'PAID' else None
                        }
                    )
                self.stdout.write(f'    Created {num_payments} premium payments')
        
        # Create claims for some policies
        for policy in policies[:2]:  # First 2 policies
            claim_number = f'CLM-{random.randint(100000, 999999)}'
            claim, created = Claim.objects.get_or_create(
                claim_number=claim_number,
                defaults={
                    'policy': policy,
                    'incident_date': date.today() - timedelta(days=random.randint(1, 60)),
                    'description': f'Incident claim for {policy.product}',
                    'claim_amount': Decimal(random.randint(1000, 50000)),
                    'status': random.choice(['SUBMITTED', 'IN_REVIEW', 'APPROVED']),
                    'approved_amount': Decimal(random.randint(500, 30000)) if random.choice([True, False]) else None
                }
            )
            if created:
                self.stdout.write(f'  Created claim: {claim_number}')
        
        # Create sample notifications
        for user in users.values():
            Notification.objects.get_or_create(
                user=user,
                title='Welcome to Vestigo',
                defaults={
                    'message': f'Welcome {user.first_name}! Your account has been set up successfully.',
                    'type': Notification.TYPE_INFO,
                    'is_read': False
                }
            )
        
        self.stdout.write(self.style.SUCCESS('\n✅ Demo data seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS(f'   Users: {len(users)}'))
        self.stdout.write(self.style.SUCCESS(f'   Leads: {len(leads)}'))
        self.stdout.write(self.style.SUCCESS(f'   Opportunities: {len(opportunities)}'))
        self.stdout.write(self.style.SUCCESS(f'   Submissions: {len(submissions)}'))
        self.stdout.write(self.style.SUCCESS(f'   Policies: {len(policies)}'))
        self.stdout.write(self.style.SUCCESS('\n📝 Default password for all users: password123'))
