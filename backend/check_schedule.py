#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy, PremiumPayment

# Check policy 20 (POL-20-1765869933)
print("=== CHECKING POLICY: POL-20-1765869933 ===")
try:
    policy = Policy.objects.get(policy_number='POL-20-1765869933')
    print(f"✓ Policy found: {policy.policy_number}")
    print(f"  Premium: ${policy.premium_amount}")
    
    # Count all payments
    all_payments = policy.payments.all()
    print(f"\n✓ TOTAL PAYMENTS CREATED: {all_payments.count()}")
    
    # List all payments
    print("\n=== ALL PAYMENTS (in order) ===")
    for i, payment in enumerate(all_payments.order_by('due_date'), 1):
        print(f"  {i}. {payment.payment_number} | Due: {payment.due_date} | Amount: ${payment.amount_due} | Status: {payment.status}")
    
except Policy.DoesNotExist:
    print("✗ Policy NOT FOUND")
