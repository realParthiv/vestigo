from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, OpportunityViewSet, ActivityViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'opportunities', OpportunityViewSet)
router.register(r'activities', ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
