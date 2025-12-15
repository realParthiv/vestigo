
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.serializers import MyTokenObtainPairSerializer

User = get_user_model()

def check_login():
    username = "bdm"
    password = "1234"
    try:
        print(f"Attempting login for {username}...")
        
        # 1. Test Serializer Validation (mimics View logic)
        serializer = MyTokenObtainPairSerializer(data={
            'username': username,
            'password': password
        })
        
        print("Serializer Validating...")
        if serializer.is_valid():
            print("LOGIN SUCCESS!")
            print(f"Data: {serializer.validated_data.keys()}")
        else:
            print("LOGIN FAILED (Validation Error)")
            print(serializer.errors)

    except Exception as e:
        print("--------------- EXCEPTION DURING LOGIN ---------------")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_login()
