import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import LateCharge, PremiumPayment, LateChargePolicy
from django.utils import timezone
from decimal import Decimal

print("=" * 80)
print("POLICIES WITH LATE CHARGES")
print("=" * 80)

late_charges = LateCharge.objects.all().select_related('policy', 'payment', 'charge_policy')

if late_charges.exists():
    print(f"\nFound {late_charges.count()} late charges:\n")
    for charge in late_charges:
        print(f"Policy Number: {charge.policy.policy_number}")
        print(f"Customer: {charge.policy.customer.first_name} {charge.policy.customer.last_name}")
        print(f"Payment Number: {charge.payment.payment_number}")
        print(f"Due Date: {charge.payment.due_date}")
        print(f"Days Overdue: {(timezone.now().date() - charge.payment.due_date).days}")
        print(f"Charge Amount: ${charge.charge_amount}")
        print(f"Policy Applied: {charge.charge_policy.name if charge.charge_policy else 'Manual'}")
        print(f"Reason: {charge.reason}")
        print(f"Status: {'Waived' if charge.waived else 'Active'}")
        print("-" * 80)
else:
    print("\nNo late charges found. Creating test late charge...")
    
    # Find an overdue payment without a late charge
    overdue = PremiumPayment.objects.filter(
        status='OVERDUE',
        late_charge__isnull=True
    ).select_related('policy').first()
    
    if overdue:
        policy = overdue.policy
        charge_policy = LateChargePolicy.objects.filter(is_active=True).first()
        
        if charge_policy:
            days_overdue = (timezone.now().date() - overdue.due_date).days
            charge_amount = charge_policy.calculate_charge(overdue, days_overdue)
            
            if charge_amount > 0:
                LateCharge.objects.create(
                    payment=overdue,
                    policy=policy,
                    charge_policy=charge_policy,
                    charge_amount=charge_amount,
                    reason=f"Late payment charge: {days_overdue} days overdue (Policy: {charge_policy.name})"
                )
                print(f"\n✓ Created late charge successfully!\n")
                print(f"Policy Number: {policy.policy_number}")
                print(f"Customer: {policy.customer.first_name} {policy.customer.last_name}")
                print(f"Payment Number: {overdue.payment_number}")
                print(f"Days Overdue: {days_overdue}")
                print(f"Charge Amount: ${charge_amount}")
                print(f"Policy Applied: {charge_policy.name}")
                print("-" * 80)

# List all policies with late charges
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

policies_with_charges = set(LateCharge.objects.values_list('policy__policy_number', flat=True))
if policies_with_charges:
    print(f"\nPolicies to test in frontend:")
    for policy_num in sorted(policies_with_charges):
        policy = LateCharge.objects.filter(policy__policy_number=policy_num).first().policy
        print(f"  • {policy_num} - {policy.customer.first_name} {policy.customer.last_name}")
else:
    print("\nNo policies with late charges yet.")
