import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from bdm.models import Activity, Lead, Opportunity
from django.contrib.auth import get_user_model

User = get_user_model()

def populate_activities():
    print("Populating activities...")
    
    # Get necessary objects
    admin_user = User.objects.first()
    if not admin_user:
        print("No user found. Please create a superuser first.")
        return

    leads = list(Lead.objects.all())
    opportunities = list(Opportunity.objects.all())
    
    if not leads and not opportunities:
        print("No leads or opportunities found. Cannot create matched activities.")
        return

    activity_types = ['CALL', 'MEETING', 'EMAIL', 'NOTE']
    summaries = [
        "Initial discovery call", "Follow-up email regarding quote", 
        "Lunch meeting with stakeholders", "Internal note on policy requirements",
        "Contract negotiation call", "Sent renewal reminder"
    ]
    
    # Create 10 random activities
    count = 0
    for _ in range(10):
        act_type = random.choice(activity_types)
        summary = random.choice(summaries)
        
        # Link to Opp or Lead
        opp = None
        lead = None
        if opportunities and random.choice([True, False]):
            opp = random.choice(opportunities)
            lead = opp.lead # Maintain consistency
        elif leads:
            lead = random.choice(leads)
            
        Activity.objects.create(
            type=act_type,
            summary=summary,
            description=f"Detailed description for {summary}...",
            performed_by=admin_user,
            performed_at=timezone.now() - timedelta(days=random.randint(0, 5), hours=random.randint(0, 23)),
            lead=lead,
            opportunity=opp
        )
        count += 1
        
    print(f"Successfully created {count} activities.")

if __name__ == '__main__':
    populate_activities()
