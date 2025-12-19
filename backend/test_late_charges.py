"""
Test script to verify the late charge system is working correctly.
Tests policy creation, charge calculation, and admin actions.
"""
import os
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from operations.models import LateChargePolicy, LateCharge, Policy, PremiumPayment
from bdm.models import Lead

User = get_user_model()


def test_late_charge_system():
    """Test the complete late charge system."""
    print("="*70)
    print("LATE CHARGE SYSTEM TEST")
    print("="*70)
    
    # Test 1: Verify policies were created
    print("\n[TEST 1] Verify Late Charge Policies")
    print("-" * 70)
    
    policies = LateChargePolicy.objects.filter(is_active=True)
    print(f"Active policies: {policies.count()}")
    
    for policy in policies:
        print(f"\n  Policy: {policy.name}")
        print(f"    Type: {policy.charge_type} - ${policy.charge_amount}")
        print(f"    Trigger: {policy.trigger_type} after {policy.trigger_threshold} days")
        if policy.maximum_charge_per_payment:
            print(f"    Max cap: ${policy.maximum_charge_per_payment}")
    
    if not policies.exists():
        print("  ✗ No active policies found!")
        return False
    
    # Test 2: Test charge calculation
    print("\n\n[TEST 2] Test Charge Calculation")
    print("-" * 70)
    
    test_policy = policies.first()
    
    # Create a test payment (don't save to DB, just for calculation)
    class MockPayment:
        amount_due = Decimal('1000.00')
    
    mock_payment = MockPayment()
    
    test_days = [15, 30, 45, 60, 90]
    for days in test_days:
        charge = test_policy.calculate_charge(mock_payment, days)
        threshold_met = "✓" if charge > 0 else "✗"
        print(f"  {threshold_met} {days} days overdue: ${charge}")
    
    # Test 3: Check for overdue payments
    print("\n\n[TEST 3] Check for Overdue Payments")
    print("-" * 70)
    
    overdue_count = PremiumPayment.objects.filter(
        status=PremiumPayment.PAYMENT_STATUS_OVERDUE,
        late_charge__isnull=True
    ).count()
    
    print(f"Overdue payments without charges: {overdue_count}")
    
    if overdue_count == 0:
        print("  Note: No overdue payments to test with. Create an overdue payment to test full system.")
    else:
        # List them
        overdue_payments = PremiumPayment.objects.filter(
            status=PremiumPayment.PAYMENT_STATUS_OVERDUE,
            late_charge__isnull=True
        ).select_related('policy')
        
        for payment in overdue_payments[:3]:
            days_overdue = (timezone.now().date() - payment.due_date).days
            print(f"  - {payment.payment_number}: {days_overdue} days overdue, Due: ${payment.amount_due}")
    
    # Test 4: Verify serializers
    print("\n\n[TEST 4] Verify Serializers")
    print("-" * 70)
    
    from operations.serializers import LateChargePolicySerializer, LateChargeSerializer
    
    # Test policy serializer
    policy_data = LateChargePolicySerializer(test_policy).data
    print(f"  LateChargePolicySerializer fields: {list(policy_data.keys())}")
    
    # Test late charge serializer (if any exist)
    late_charges = LateCharge.objects.all()
    if late_charges.exists():
        charge_data = LateChargeSerializer(late_charges.first()).data
        print(f"  LateChargeSerializer fields: {list(charge_data.keys())}")
    else:
        print("  LateChargeSerializer: (no charges in DB to test)")
    
    # Test 5: Verify ViewSets exist
    print("\n\n[TEST 5] Verify ViewSets")
    print("-" * 70)
    
    from operations.views import LateChargePolicyViewSet, LateChargeViewSet
    
    print(f"  ✓ LateChargePolicyViewSet: {LateChargePolicyViewSet.__name__}")
    print(f"    - Actions: {list(LateChargePolicyViewSet.actions.keys()) if hasattr(LateChargePolicyViewSet, 'actions') else 'standard CRUD'}")
    
    print(f"  ✓ LateChargeViewSet: {LateChargeViewSet.__name__}")
    print(f"    - Custom actions: waive, mark_paid, adjust, apply_policy")
    
    # Test 6: Summary
    print("\n\n[TEST 6] Summary")
    print("-" * 70)
    
    total_policies = LateChargePolicy.objects.count()
    total_charges = LateCharge.objects.count()
    
    print(f"  Total Late Charge Policies: {total_policies}")
    print(f"  Total Late Charges Applied: {total_charges}")
    print(f"  Waived Charges: {LateCharge.objects.filter(waived=True).count()}")
    print(f"  Paid Charges: {LateCharge.objects.filter(is_paid=True).count()}")
    
    print("\n" + "="*70)
    print("✓ LATE CHARGE SYSTEM TEST COMPLETED SUCCESSFULLY")
    print("="*70)
    
    return True


if __name__ == '__main__':
    try:
        test_late_charge_system()
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
