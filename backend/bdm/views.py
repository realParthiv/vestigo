from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum
from .models import Lead, Opportunity, Activity
from core.permissions import RolePermission
from users.models import Role
from .serializers import LeadSerializer, OpportunitySerializer, ActivitySerializer

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.filter(is_active=True)
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.BDM]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'company_name', 'email']
    ordering_fields = ['created_at', 'updated_at']

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.filter(is_active=True)
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.BDM]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['stage', 'assigned_to']
    search_fields = ['name', 'lead__company_name']

    @action(detail=True, methods=['post'])
    def move_stage(self, request, pk=None):
        opportunity = self.get_object()
        new_stage = request.data.get('stage')
        if new_stage in dict(Opportunity.STAGE_CHOICES):
            opportunity.stage = new_stage
            opportunity.save()
            return Response({'status': 'stage updated', 'new_stage': new_stage})
        return Response({'error': 'Invalid stage'}, status=400)

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.BDM]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activity_type', 'opportunity', 'lead']

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = None  # Dashboard accessible to authenticated users; restrict via role if needed

    def get(self, request):
        total_leads = Lead.objects.filter(is_active=True).count()
        active_opportunities = Opportunity.objects.filter(is_active=True).exclude(stage__in=['CLOSED_WON', 'CLOSED_LOST']).count()
        total_revenue = Opportunity.objects.filter(is_active=True, stage='CLOSED_WON').aggregate(total=Sum('expected_revenue'))['total'] or 0
        
        # Pipeline breakdown
        pipeline = Opportunity.objects.filter(is_active=True).values('stage').annotate(count=Count('id')).order_by('stage')
        pipeline_data = {item['stage']: item['count'] for item in pipeline}

        # Recent Leads
        recent_leads = Lead.objects.filter(is_active=True).order_by('-created_at')[:5]
        recent_leads_data = LeadSerializer(recent_leads, many=True).data
        
        # Recent Activity (across all types)
        recent_activities = Activity.objects.order_by('-created_at')[:10]
        recent_activity_data = ActivitySerializer(recent_activities, many=True).data
        
        # Upcoming Renewals (Policies expiring in next 30 days)
        from datetime import date, timedelta
        from operations.models import Policy
        from operations.serializers import PolicySerializer
        next_30_days = date.today() + timedelta(days=30)
        upcoming_renewals = Policy.objects.filter(is_active=True, end_date__range=[date.today(), next_30_days]).order_by('end_date')[:5]
        upcoming_renewals_data = PolicySerializer(upcoming_renewals, many=True).data

        return Response({
            'total_leads': total_leads,
            'active_opportunities': active_opportunities,
            'total_revenue': total_revenue,
            'pipeline_breakdown': pipeline_data,
            'recent_leads': recent_leads_data,
            'recent_activities': recent_activity_data,
            'upcoming_renewals': upcoming_renewals_data
        })
