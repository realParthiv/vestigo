#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy
from underwriting.models import Submission

# Check the policy with that ID
try:
    policy = Policy.objects.get(policy_number='POL-35-1765807997')
    print(f"✓ Policy found: {policy.id}, {policy.policy_number}")
    print(f"  Customer: {policy.customer}")
    print(f"  Premium: {policy.premium_amount}")
    print(f"  Status: {policy.status}")
except Policy.DoesNotExist:
    print("✗ Policy POL-35-1765807997 NOT FOUND in database")

# Check submissions
print("\nRecent submissions:")
for s in Submission.objects.all().order_by('-id')[:5]:
    print(f"  ID {s.id}: {s.opportunity.name} - Status: {s.status}")
    if s.opportunity.id == 35:
        print(f"    ^^^ THIS IS YOUR OPPORTUNITY (opp 35)")
