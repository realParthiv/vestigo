from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BankStatementViewSet, BankLineViewSet, BrokerageStatementViewSet, BrokerageLineViewSet

router = DefaultRouter()
router.register(r'statements', BankStatementViewSet)
router.register(r'lines', BankLineViewSet)
router.register(r'brokerage-statements', BrokerageStatementViewSet)
router.register(r'brokerage-lines', BrokerageLineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
