from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PolicyViewSet, PremiumPaymentViewSet, LateChargePolicyViewSet, LateChargeViewSet

router = DefaultRouter()
router.register(r'policies', PolicyViewSet)
router.register(r'payments', PremiumPaymentViewSet)
router.register(r'late-charge-policies', LateChargePolicyViewSet)
router.register(r'late-charges', LateChargeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
