from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClaimViewSet

router = DefaultRouter()
router.register(r'', ClaimViewSet, basename='claims')

urlpatterns = [
    path('', include(router.urls)),
]
