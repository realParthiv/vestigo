from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Role
from core.permissions import RolePermission
from .serializers import UserSerializer, RoleSerializer, RegisterSerializer, MyTokenObtainPairSerializer

User = get_user_model()

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Keep minimal logging and let DRF/SimpleJWT handle errors properly (401 on bad creds)
        print("LOGIN REQUEST RECEIVED")
        return super().post(request, *args, **kwargs)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = None  # Admins can see all; others constrained in get_queryset

    def get_queryset(self):
        # Example: Users can only see themselves unless Admin
        user = self.request.user
        if user.is_staff or (user.role and user.role.name == Role.ADMIN):
            return User.objects.filter(is_active=True)
        return User.objects.filter(id=user.id)

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN]
