
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from reports.views import DashboardStatsView
from notifications.views import NotificationViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

def test_dashboard():
    print("\n=== Testing DashboardStatsView ===")
    User = get_user_model()
    try:
        user = User.objects.get(username='bdm')
    except User.DoesNotExist:
        print("User 'bdm' not found! Creating one...")
        user = User.objects.create_user('bdm', 'bdm@example.com', '1234')

    factory = APIRequestFactory()
    request = factory.get('/api/v1/reports/dashboard-stats/')
    force_authenticate(request, user=user)
    
    # We need to wrap it because as_view() returns a function
    view = DashboardStatsView.as_view()
    
    try:
        response = view(request)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Data Keys:", response.data.keys())
            # print("Data:", response.data)
        else:
            print("Error Data:", response.data)
    except Exception as e:
        print("CRASHED (Dashboard):")
        import traceback
        traceback.print_exc()

def test_notifications():
    print("\n=== Testing NotificationViewSet ===")
    User = get_user_model()
    user = User.objects.get(username='bdm')
    
    factory = APIRequestFactory()
    request = factory.get('/api/v1/notifications/notifications/')
    force_authenticate(request, user=user)

    view = NotificationViewSet.as_view({'get': 'list'})
    
    try:
        response = view(request)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
             print("Data Count:", len(response.data))
             if len(response.data) > 0:
                 print("First Item:", response.data[0])
        else:
            print("Error Data:", response.data)
    except Exception as e:
        print("CRASHED (Notifications):")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dashboard()
    test_notifications()
