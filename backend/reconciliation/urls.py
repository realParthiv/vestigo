from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BankStatementViewSet, BankLineViewSet

router = DefaultRouter()
router.register(r'statements', BankStatementViewSet)
router.register(r'lines', BankLineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
