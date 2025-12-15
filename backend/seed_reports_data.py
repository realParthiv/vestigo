"""
Seed data for Reports Dashboard testing
Creates policies and claims with varying dates and statuses
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from bdm.models import Lead, Opportunity
from operations.models import Policy
from claims.models import Claim
from django.utils import timezone

User = get_user_model()

def seed_reports_data():
    print("Starting reports data seeding...")
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='bdm',
        defaults={
            'email': 'bdm@example.com',
            'first_name': 'Business',
            'last_name': 'Manager'
        }
    )
    
    # Create some leads
    print("Creating leads...")
    leads = []
    for i in range(20):
        lead, _ = Lead.objects.get_or_create(
            email=f'customer{i+1}@example.com',
            defaults={
                'first_name': f"Customer",
                'last_name': f"Test {i+1}",
                'phone': f'+1234567{i:04d}',
                'status': 'QUALIFIED',
                'source': 'REFERRAL',
                'company_name': f'Company {i+1}'
            }
        )
        leads.append(lead)
    
    # Create opportunities
    print("Creating opportunities...")
    opportunities = []
    for i, lead in enumerate(leads):
        close_date = timezone.now() + timedelta(days=30)
        opp, _ = Opportunity.objects.get_or_create(
            name=f"Insurance Opportunity {i+1}",
            lead=lead,
            defaults={
                'stage': 'CLOSED_WON' if i % 2 == 0 else 'QUOTE',
                'expected_revenue': Decimal(5000 + (i * 500)),
                'expected_close_date': close_date.date()
            }
        )
        opportunities.append(opp)
    
    # Create policies with different dates
    print("Creating policies...")
    today = timezone.now()
    
    policy_types = ['HEALTH', 'AUTO', 'LIFE', 'PROPERTY', 'BUSINESS']
    
    policies_data = []
    
    # Policies from the last year (for year filter)
    for i in range(50):
        days_ago = i * 7  # Spread policies over last 350 days
        start_date = today - timedelta(days=days_ago)
        end_date = start_date + timedelta(days=365)
        
        # Mix of expired and active policies
        if days_ago > 30 and i % 3 == 0:
            # Expired policy (ended in the past)
            status = 'ACTIVE' if i % 2 == 0 else 'EXPIRED'  # 50% renewed
            end_date = start_date + timedelta(days=180)  # Ended 6 months from start
        else:
            status = 'ACTIVE'
        
        policy_data = {
            'policy_number': f'POL-2024-{i+1:04d}',
            'customer': leads[i % len(leads)],
            'policy_type': policy_types[i % len(policy_types)],
            'premium_amount': Decimal(1000 + (i * 100)),
            'start_date': start_date,
            'end_date': end_date,
            'status': status
        }
        policies_data.append(policy_data)
    
    # Bulk create policies
    for policy_data in policies_data:
        Policy.objects.update_or_create(
            policy_number=policy_data['policy_number'],
            defaults=policy_data
        )
    
    print(f"Created {len(policies_data)} policies")
    
    # Create claims with different processing times
    print("Creating claims...")
    policies = list(Policy.objects.all()[:30])  # Use first 30 policies
    
    claim_statuses = ['APPROVED', 'REJECTED', 'IN_REVIEW', 'PENDING']
    
    for i in range(40):
        days_ago = i * 5  # Spread claims over time
        created_at = today - timedelta(days=days_ago)
        
        # Processing time varies (1-10 days)
        processing_days = (i % 10) + 1
        
        # Set updated_at based on status
        if i % 4 == 3:  # 25% still pending
            status = 'PENDING'
            updated_at = created_at
        else:
            status = claim_statuses[i % 3]  # APPROVED, REJECTED, or IN_REVIEW
            updated_at = created_at + timedelta(days=processing_days)
        
        Claim.objects.update_or_create(
            claim_number=f'CLM-2024-{i+1:04d}',
            defaults={
                'policy': policies[i % len(policies)],
                'claim_amount': Decimal(500 + (i * 200)),
                'incident_date': created_at.date(),  # Add incident date
                'status': status,
                'description': f'Test claim {i+1} - Processing time: {processing_days} days',
                'created_at': created_at,
                'updated_at': updated_at
            }
        )
    
    print(f"Created 40 claims with varying processing times")
    
    # Print summary
    print("\n" + "="*50)
    print("SEEDING SUMMARY")
    print("="*50)
    print(f"Total Policies: {Policy.objects.count()}")
    print(f"  - Active: {Policy.objects.filter(status='ACTIVE').count()}")
    print(f"  - Expired: {Policy.objects.filter(status='EXPIRED').count()}")
    print(f"\nTotal Claims: {Claim.objects.count()}")
    print(f"  - Approved: {Claim.objects.filter(status='APPROVED').count()}")
    print(f"  - Rejected: {Claim.objects.filter(status='REJECTED').count()}")
    print(f"  - Pending: {Claim.objects.filter(status='PENDING').count()}")
    print(f"  - In Review: {Claim.objects.filter(status='IN_REVIEW').count()}")
    print("\n" + "="*50)
    print("Seeding completed! You can now test the reports page.")
    print("Try switching between Month, Quarter, and Year filters!")
    print("="*50)

if __name__ == '__main__':
    seed_reports_data()
