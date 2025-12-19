#!/usr/bin/env python
"""
Quick script to show policies with late charges applied.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import LateCharge, Policy

print("\n" + "="*80)
print(" POLICIES WITH LATE CHARGES - READY FOR TESTING IN FRONTEND")
print("="*80 + "\n")

late_charges = LateCharge.objects.all().select_related('policy', 'payment').order_by('-created_at')

if not late_charges.exists():
    print("❌ No late charges found in system.\n")
    sys.exit(1)

print(f"✓ Found {late_charges.count()} late charge(s)\n")

policies_set = {}
for charge in late_charges:
    policy_num = charge.policy.policy_number
    if policy_num not in policies_set:
        policies_set[policy_num] = {
            'policy': charge.policy,
            'charges': []
        }
    policies_set[policy_num]['charges'].append(charge)

for idx, (policy_num, data) in enumerate(sorted(policies_set.items()), 1):
    policy = data['policy']
    charges = data['charges']
    
    total_charge = sum(c.charge_amount for c in charges)
    active_charges = [c for c in charges if not c.waived]
    
    print(f"{idx}. {policy_num}")
    print(f"   Customer: {policy.customer.first_name} {policy.customer.last_name}")
    print(f"   Premium: ${policy.premium_amount:,.2f}")
    print(f"   Late Charges: {len(charges)} total")
    print(f"   Total Charge Amount: ${total_charge:,.2f}")
    
    if active_charges:
        print(f"   Active Charges: {len(active_charges)} (${sum(c.charge_amount for c in active_charges):,.2f})")
    
    waived_charges = [c for c in charges if c.waived]
    if waived_charges:
        print(f"   Waived Charges: {len(waived_charges)}")
    
    print(f"\n   Payments with charges:")
    for charge in charges:
        status = "WAIVED" if charge.waived else ("PAID" if charge.is_paid else "ACTIVE")
        days_overdue = (charge.payment.due_date.days if hasattr(charge.payment.due_date, 'days') else 0)
        print(f"     • {charge.payment.payment_number}: ${charge.charge_amount:,.2f} [{status}]")
    
    print("\n" + "-"*80 + "\n")

print("\n" + "="*80)
print(" HOW TO TEST IN FRONTEND")
print("="*80 + "\n")
print("1. Go to the Policies page")
print("2. Click on any policy number above")
print("3. Scroll to 'Premium Payment History'")
print("4. Look for payments with ⚠️ Late Payment Charge Applied")
print("5. See detailed breakdown with:")
print("   • Charge amount")
print("   • Why it was applied")
print("   • Original due amount vs charge fee vs total due")
print("   • Status (Active/Waived/Paid)")
print("\n" + "="*80 + "\n")
