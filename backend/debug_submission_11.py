#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy
from underwriting.models import Submission
from bdm.models import Opportunity

print("=== CHECKING SUBMISSION 11 ===")
try:
    sub = Submission.objects.get(id=11)
    print(f"✓ Submission 11 found")
    print(f"  Status: {sub.status}")
    print(f"  Opportunity: {sub.opportunity_id} - {sub.opportunity.name if sub.opportunity else 'NONE'}")
except Submission.DoesNotExist:
    print("✗ Submission 11 NOT FOUND")
    exit(1)

print("\n=== CHECKING OPPORTUNITY 20 ===")
try:
    opp = Opportunity.objects.get(id=20)
    print(f"✓ Opportunity 20 found: {opp.name}")
    print(f"  Lead: {opp.lead}")
    print(f"  Expected Revenue: ${opp.expected_revenue}")
except Opportunity.DoesNotExist:
    print("✗ Opportunity 20 NOT FOUND")
    exit(1)

print("\n=== CHECKING POLICIES FROM OPPORTUNITY 20 ===")
# Check all policies with 'POL-20' in the number
all_policies = Policy.objects.all().filter(customer_id=opp.lead.id)
print(f"Policies for lead {opp.lead.id} ({opp.lead}):")
if all_policies.exists():
    for p in all_policies:
        active = "✓ ACTIVE" if p.is_active else "✗ DELETED"
        print(f"  {p.policy_number}: {active} | Premium: ${p.premium_amount}")
else:
    print(f"  ✗ NO POLICIES FOUND")

print("\n=== LAST 10 POLICIES CREATED ===")
recent = Policy.objects.all().order_by('-created_at')[:10]
for p in recent:
    print(f"  {p.policy_number}: OppID={p.policy_number.split('-')[1] if '-' in p.policy_number else 'N/A'} | Created: {p.created_at}")

print("\n=== CHECKING IF POLICY-20 WAS SUPPOSED TO BE CREATED ===")
# The approval action should create: POL-{opp.id}-{timestamp}
# For opp 20, it should be: POL-20-{timestamp}
print("Looking for policies starting with 'POL-20-'...")
pol20 = Policy.objects.filter(policy_number__startswith='POL-20-')
if pol20.exists():
    for p in pol20:
        print(f"  ✓ {p.policy_number}")
else:
    print(f"  ✗ NO POLICY WITH PREFIX POL-20- FOUND")
