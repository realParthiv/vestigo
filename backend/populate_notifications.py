import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

def populate_notifications():
    print("Populating notifications...")
    user = User.objects.first()
    if not user:
        return

    Notification.objects.create(user=user, title="New Lead Assigned", message="You have been assigned a new lead: John Doe", type="INFO")
    Notification.objects.create(user=user, title="Policy Renewal Alert", message="Policy POL-12345 extends in 30 days.", type="WARNING")
    Notification.objects.create(user=user, title="Claim Approved", message="Claim CLM-99887 has been approved for payment.", type="SUCCESS")
    
    print("Notifications created.")

if __name__ == '__main__':
    populate_notifications()
