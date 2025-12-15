import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from notifications.models import Notification
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def seed_notifications():
    try:
        user = User.objects.get(username='bdm')
    except User.DoesNotExist:
        print("User 'bdm' not found!")
        return

    # Clear existing notifications for bdm
    Notification.objects.filter(user=user).delete()
    print("Cleared existing notifications for bdm")

    notifications_data = [
        {
            'title': 'New Submission Pending',
            'message': 'Submission #12345 from Acme Corp requires your review',
            'type': 'INFO',
            'is_read': False
        },
        {
            'title': 'Urgent: Policy Renewal',
            'message': 'Policy POL-2024-001 expires in 3 days',
            'type': 'WARNING',
            'is_read': False
        },
        {
            'title': 'Claim Approved',
            'message': 'Claim CLM-2024-789 has been approved for $15,000',
            'type': 'SUCCESS',
            'is_read': False
        },
        {
            'title': 'New Lead Assignment',
            'message': 'You have been assigned lead: John Smith - Auto Insurance',
            'type': 'INFO',
            'is_read': False
        },
        {
            'title': 'Premium Payment Received',
            'message': 'Payment of $2,500 received for Policy POL-2024-045',
            'type': 'SUCCESS',
            'is_read': False
        },
        {
            'title': 'Document Upload Required',
            'message': 'Missing documents for Submission #12350',
            'type': 'WARNING',
            'is_read': False
        },
        {
            'title': 'Meeting Scheduled',
            'message': 'Underwriting review meeting scheduled for tomorrow at 10 AM',
            'type': 'INFO',
            'is_read': False
        },
    ]

    created_count = 0
    for notif_data in notifications_data:
        Notification.objects.create(
            user=user,
            **notif_data
        )
        created_count += 1

    print(f"Successfully created {created_count} notifications for user 'bdm'")

if __name__ == "__main__":
    seed_notifications()
