import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vestigo_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from users.models import Role
from bdm.models import Lead, Opportunity, Activity
from rest_framework.test import APIRequestFactory
from users.views import RegisterView
from bdm.views import LeadViewSet

def verify():
    print("Verifying Vestigo CRM Mock Setup...")
    User = get_user_model()
    
    # 1. Create Roles
    admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)
    bdm_role, _ = Role.objects.get_or_create(name=Role.BDM)
    print(f"[OK] Roles ensured: {admin_role}, {bdm_role}")

    # 2. Create User
    if not User.objects.filter(username="test_bdm").exists():
        user = User.objects.create_user("test_bdm", "test@example.com", "password123")
        user.role = bdm_role
        user.save()
        print("[OK] Test User created")
    else:
        user = User.objects.get(username="test_bdm")
        print("[OK] Test User exists")

    # 3. Create Lead (Model Level)
    lead = Lead.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@doe.com",
        phone="1234567890",
        source="Website",
        assigned_to=user
    )
    print(f"[OK] Lead created: {lead}")

    # 4. Create Opportunity
    opp = Opportunity.objects.create(
        lead=lead,
        name="Big Insurance Deal",
        stage=Opportunity.STAGE_DISCOVERY,
        assigned_to=user
    )
    print(f"[OK] Opportunity created: {opp}")

    # 5. Serialization Check (Basic) - simulating API flow is complex without server, 
    # but we can check if serializers work by importing them.
    from bdm.serializers import LeadSerializer
    ls = LeadSerializer(lead)
    assert ls.data['first_name'] == "John"
    print(f"[OK] Lead Serializer works: {ls.data['first_name']}")

    print("\nVerification Complete! Database works, Models work, Serializers work.")

if __name__ == "__main__":
    verify()
