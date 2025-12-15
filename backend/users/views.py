from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Role
from .serializers import UserSerializer, RoleSerializer, RegisterSerializer, MyTokenObtainPairSerializer

User = get_user_model()

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        print("--------------------------------------------------")
        print(f"LOGIN REQUEST RECEIVED: {request.data}")
        try:
            response = super().post(request, *args, **kwargs)
            print(f"LOGIN SUCCESS: {response.data}")
            return response
        except Exception as e:
            import traceback
            import sys
            print("LOGIN ERROR TRACEBACK:")
            traceback.print_exc(file=sys.stdout)
            print("--------------------------------------------------")
            return Response({'error': str(e)}, status=500)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Example: Users can only see themselves unless Admin
        user = self.request.user
        if user.is_staff or (user.role and user.role.name == Role.ADMIN):
            return User.objects.filter(is_active=True)
        return User.objects.filter(id=user.id)

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
