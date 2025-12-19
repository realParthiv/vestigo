#!/bin/bash
cd /mnt/d/RFP\ FOR\ ERP\ SYSTEM/vestigo/backend
source venv/bin/activate
python3 manage.py shell << EOF
from operations.models import LateCharge
charges = LateCharge.objects.all().select_related('policy')
print("\n" + "="*70)
print("POLICIES WITH LATE CHARGES - READY FOR FRONTEND TESTING")
print("="*70 + "\n")
for c in charges:
    print(f"Policy: {c.policy.policy_number}")
    print(f"Payment: {c.payment.payment_number}")
    print(f"Charge: ${c.charge_amount}")
    print(f"Status: {'Waived' if c.waived else 'Active'}")
    print("-"*70)
print(f"\nTotal Late Charges: {len(list(charges))}")
EOF
