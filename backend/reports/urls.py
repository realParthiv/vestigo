from django.urls import path
from .views import DashboardStatsView, AdvancedReportsView

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('advanced-reports/', AdvancedReportsView.as_view(), name='advanced-reports'),
]
