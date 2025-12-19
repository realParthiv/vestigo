from operations.models import Policy, LateCharge, PremiumPayment
import json
p = Policy.objects.get(policy_number="POL-39-1765952764")
payments = list(PremiumPayment.objects.filter(policy=p).order_by("due_date").values("id","payment_number","status","due_date","late_charge_id"))
charges = list(LateCharge.objects.filter(policy=p).values("id","payment_id","charge_amount","is_paid","waived","created_at"))
print(json.dumps({"policy": p.policy_number, "payments": payments, "charges": charges}, default=str, indent=2))
