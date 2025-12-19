import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy, PremiumPayment, LateCharge, LateChargePolicy

print("=" * 80)
print("ACTUAL DATABASE VERIFICATION")
print("=" * 80)

# Check Policies
print("\n1. POLICIES IN DATABASE:")
print("-" * 80)
policies = Policy.objects.filter(is_active=True).order_by('-created_at')[:10]
for p in policies:
    print(f"  ID: {p.id} | {p.policy_number} | Customer: {p.customer.first_name} {p.customer.last_name}")
print(f"\nTotal Active Policies: {Policy.objects.filter(is_active=True).count()}")

# Check Payments
print("\n\n2. PAYMENTS IN DATABASE:")
print("-" * 80)
payments = PremiumPayment.objects.all().select_related('policy')[:10]
for pay in payments:
    print(f"  ID: {pay.id} | {pay.payment_number} | Policy: {pay.policy.policy_number}")
print(f"\nTotal Payments: {PremiumPayment.objects.count()}")

# Check Late Charge Policies
print("\n\n3. LATE CHARGE POLICIES:")
print("-" * 80)
lc_policies = LateChargePolicy.objects.all()
for lcp in lc_policies:
    print(f"  ID: {lcp.id} | {lcp.name} | Active: {lcp.is_active}")
print(f"\nTotal: {LateChargePolicy.objects.count()}")

# Check Late Charges
print("\n\n4. LATE CHARGES IN DATABASE:")
print("-" * 80)
charges = LateCharge.objects.all().select_related('payment', 'policy')
if charges.exists():
    for c in charges:
        print(f"  Late Charge ID: {c.id}")
        print(f"  Payment ID: {c.payment_id} | {c.payment.payment_number}")
        print(f"  Policy: {c.policy.policy_number}")
        print(f"  Amount: ${c.charge_amount}")
        print("-" * 40)
    print(f"\nTotal Late Charges: {charges.count()}")
else:
    print("  NO LATE CHARGES IN DATABASE YET")
    
print("\n" + "=" * 80)
