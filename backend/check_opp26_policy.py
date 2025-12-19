#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy
from underwriting.models import Submission
from bdm.models import Opportunity

# Check opportunity 26
try:
    opp = Opportunity.objects.get(id=26)
    print(f"✓ Opportunity 26 found: {opp.name}")
    print(f"  Lead: {opp.lead}")
    print(f"  Stage: {opp.stage}")
    print(f"  Expected Revenue: ${opp.expected_revenue}")
except Opportunity.DoesNotExist:
    print("✗ Opportunity 26 NOT FOUND")
    exit(1)

# Check submission for opportunity 26
print("\n=== SUBMISSIONS FOR OPP 26 ===")
submissions = Submission.objects.filter(opportunity_id=26)
for sub in submissions:
    print(f"  SUB-{sub.id}: Status = {sub.status}")

# Check ALL policies (including is_active=False)
print("\n=== ALL POLICIES (including soft-deleted) ===")
all_policies = Policy.objects.all().order_by('-id')[:20]
for p in all_policies:
    status = "✓ ACTIVE" if p.is_active else "✗ DELETED"
    print(f"  {p.policy_number}: {status} | OppID extracted from policy#: {p.policy_number.split('-')[1] if '-' in p.policy_number else 'N/A'}")

# Check for policies specifically from opp 26
print("\n=== POLICIES FROM OPPORTUNITY 26 ===")
opp26_policies = Policy.objects.all().filter(customer_id=opp.lead.id)
if opp26_policies.exists():
    for p in opp26_policies:
        active = "✓ ACTIVE" if p.is_active else "✗ DELETED"
        print(f"  {p.policy_number}: {active}")
else:
    print("  ✗ NO POLICIES FOUND FOR OPP 26'S LEAD")

print("\n=== ACTIVE POLICIES (filtered by is_active=True) ===")
active = Policy.objects.filter(is_active=True).order_by('-id')[:5]
for p in active:
    print(f"  {p.policy_number}: ${p.premium_amount}")
