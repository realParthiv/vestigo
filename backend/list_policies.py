import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy

print("Active Policies for Testing:\n")
print("="*70)

policies = Policy.objects.filter(is_active=True).order_by('-created_at')[:10]

for p in policies:
    print(f"Policy Number: {p.policy_number}")
    print(f"Customer: {p.customer.first_name} {p.customer.last_name}")
    print(f"Premium Amount: ${p.premium_amount}")
    print(f"Status: {p.status}")
    print(f"Created: {p.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*70)

print(f"\nTotal active policies: {Policy.objects.filter(is_active=True).count()}")
