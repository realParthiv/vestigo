from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from bdm.models import Lead, Opportunity
from operations.models import Policy
from claims.models import Claim
from reconciliation.models import BankStatement, BankLine
from users.models import Role
import random
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with sample CRM data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating data...')

        # Ensure BDM user
        bdm_role, _ = Role.objects.get_or_create(name=Role.BDM)
        user, created = User.objects.get_or_create(username='test_bdm', defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'BDM'
        })
        if created:
            user.set_password('password123')
            user.role = bdm_role
            user.save()

        # 1. Leads
        if Lead.objects.count() < 10:
            self.create_leads(user)
        
        # 2. Policies
        self.create_policies()

        # 3. Claims
        self.create_claims()

        # 4. Create Bank Statement and Lines
        self.stdout.write("Generating Bank Statements...")
        statement = BankStatement.objects.create(name=f"Statement {timezone.now().strftime('%B %Y')}")
        
        policies = list(Policy.objects.all())
        # Scenario A: Perfect Matches
        policies_to_pay = policies[:8] # First 8 policies paid
        for policy in policies_to_pay:
            BankLine.objects.create(
                statement=statement,
                date=policy.start_date,
                description=f"Premium Payment for {policy.policy_number}",
                amount=policy.premium_amount,
                reference=f"REF-{random.randint(10000, 99999)}",
                status=BankLine.STATUS_UNMATCHED # Will be matched by auto-runner
            )

        # Scenario B: Unmatched (Payment received but no policy found / Wrong Amount)
        for i in range(3):
            BankLine.objects.create(
                statement=statement,
                date=timezone.now().date(),
                description=f"Unknown Transfer {i+1}",
                amount=random.randint(1000, 5000),
                reference=f"UNK-{random.randint(10000, 99999)}",
                status=BankLine.STATUS_UNMATCHED
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully created Bank Statement with lines'))

    def create_leads(self, user):
        self.stdout.write('Creating Leads...')
        first_names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Hannah', 'Ivy', 'Jack', 'Kevin', 'Liam', 'Mia', 'Noah', 'Olivia']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez']
        companies = ['TechCorp', 'InsurCo', 'BizSolutions', 'GlobalTrade', 'LogisticsInc', 'AlphaGroup']
        sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn']

        for _ in range(50):
            Lead.objects.create(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"lead{random.randint(1000,9999)}@example.com",
                phone=f"+1{random.randint(1000000000, 9999999999)}",
                company_name=random.choice(companies),
                source=random.choice(sources),
                status=random.choice([s[0] for s in Lead.STATUS_CHOICES]),
                assigned_to=user
            )
        
        # Create Opportunities
        leads = Lead.objects.all()
        for lead in leads[:30]:
            if Opportunity.objects.filter(lead=lead).exists(): continue
            
            if random.choice([True, False]):
                Opportunity.objects.create(
                    lead=lead,
                    name=f"{lead.company_name} Deal",
                    stage=random.choice([s[0] for s in Opportunity.STAGE_CHOICES]),
                    expected_revenue=random.randint(10000, 500000),
                    expected_close_date=timezone.now().date() + timedelta(days=random.randint(5, 90)),
                    assigned_to=user
                )

    def create_policies(self):
        self.stdout.write('Creating Policies...')
        # Convert some Won opportunities or just random leads to Policy holders
        leads = Lead.objects.all()
        count = 0
        for lead in leads:
            # Randomly create policy if not exists
            if random.random() > 0.7: # 30% chance
                policy_type = random.choice([t[0] for t in Policy.TYPE_CHOICES])
                start_date = timezone.now().date() - timedelta(days=random.randint(1, 365))
                end_date = start_date + timedelta(days=365)
                
                Policy.objects.get_or_create(
                    customer=lead,
                    policy_type=policy_type,
                    defaults={
                        'policy_number': f"POL-{random.randint(10000, 99999)}",
                        'start_date': start_date,
                        'end_date': end_date,
                        'premium_amount': random.randint(500, 5000),
                        'status': Policy.STATUS_ACTIVE
                    }
                )
                count += 1
        self.stdout.write(f'Ensured {count} policies')

    def create_claims(self):
        self.stdout.write('Creating Claims...')
        policies = Policy.objects.all()
        count = 0
        for policy in policies:
            if random.random() > 0.8: # 20% chance of claim
                incident_date = policy.start_date + timedelta(days=random.randint(1, 100))
                Claim.objects.get_or_create(
                    policy=policy,
                    defaults={
                        'claim_number': f"CLM-{random.randint(10000, 99999)}",
                        'incident_date': incident_date,
                        'description': "Accident happened on highway",
                        'claim_amount': random.randint(1000, 20000),
                        'status': random.choice([s[0] for s in Claim.STATUS_CHOICES])
                    }
                )
                count += 1
        self.stdout.write(f'Ensured {count} claims')
