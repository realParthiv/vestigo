#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy

# Check all policies (including soft-deleted)
print("=== ALL POLICIES (including is_active=False) ===")
all_policies = Policy.objects.all()
for p in all_policies:
    status = "✓ ACTIVE" if p.is_active else "✗ DELETED"
    print(f"  {p.policy_number}: {status} | is_active={p.is_active}")

print(f"\nTotal: {all_policies.count()}")

# Check only active policies (what API returns)
print("\n=== ACTIVE POLICIES (is_active=True) ===")
active_policies = Policy.objects.filter(is_active=True)
for p in active_policies:
    print(f"  {p.policy_number}: {p.customer} | Premium: ${p.premium_amount}")

print(f"\nTotal Active: {active_policies.count()}")

# Check the specific policy
print("\n=== TARGET POLICY ===")
try:
    policy = Policy.objects.get(policy_number='POL-35-1765807997')
    print(f"Found: {policy.policy_number}")
    print(f"  is_active: {policy.is_active}")
    print(f"  Status: {policy.status}")
    print(f"  Will appear in API: {'YES ✓' if policy.is_active else 'NO ✗'}")
except Policy.DoesNotExist:
    print("NOT FOUND in database")
