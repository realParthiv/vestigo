from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from operations.models import Policy
from claims.models import Claim
from bdm.models import Opportunity
from underwriting.models import Submission

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # 1. Total Written Premium (Active Policies)
            total_premium = Policy.objects.filter(status='ACTIVE').aggregate(Sum('premium_amount'))['premium_amount__sum'] or 0

            # 2. Total Claims Verified (Approved/Paid)
            total_claims_amount = Claim.objects.exclude(status='REJECTED').aggregate(Sum('claim_amount'))['claim_amount__sum'] or 0

            # 3. Claims Ratio
            loss_ratio = 0
            if total_premium > 0:
                loss_ratio = (total_claims_amount / total_premium) * 100

            # 4. Pipeline Stats
            opportunities_by_stage = Opportunity.objects.values('stage').annotate(count=Count('id'))
            
            # 5. Underwriting Queue
            pending_submissions = Submission.objects.filter(status='PENDING').count()

            # 6. Recent Activity (Last 5)
            # Assuming Activity model exists in bdm as found in file view
            from bdm.models import Activity
            from django.utils import timezone
            from datetime import timedelta
            
            recent_activities = []
            activities_qs = Activity.objects.select_related('lead', 'opportunity').order_by('-performed_at')[:5]
            for act in activities_qs:
                recent_activities.append({
                    'id': act.id,
                    'activity_type': act.get_type_display(), # 'type' is the field, getting display name
                    'notes': act.summary, # Mapping summary to notes as expected by frontend
                    'created_at': act.performed_at
                })

            # 7. Upcoming Renewals (Next 30 Days)
            today = timezone.now().date()
            thirty_days_later = today + timedelta(days=30)
            
            upcoming_renewals = []
            renewals_qs = Policy.objects.filter(
                status='ACTIVE',
                end_date__range=[today, thirty_days_later]
            ).select_related('customer').order_by('end_date')[:5]
            
            for pol in renewals_qs:
                upcoming_renewals.append({
                    'id': pol.id,
                    'policy_number': pol.policy_number,
                    'customer_name': f"{pol.customer.first_name} {pol.customer.last_name}",
                    'end_date': pol.end_date
                })

            # 8. Policy Distribution (By Type)
            policy_distribution_qs = Policy.objects.values('policy_type').annotate(count=Count('id'))
            total_policies = Policy.objects.count()
            policy_distribution = []
            for dist in policy_distribution_qs:
                policy_distribution.append({
                    'policy_type': dist['policy_type'],
                    'count': dist['count'],
                    'percentage': round((dist['count'] / total_policies * 100) if total_policies > 0 else 0, 1)
                })

            # 9. Recent Notifications
            from notifications.models import Notification
            recent_notifications = Notification.objects.filter(user=request.user, is_read=False).order_by('-created_at')[:5].values(
                'id', 'title', 'message', 'type', 'created_at', 'link'
            )

            return Response({
                'total_premium': total_premium,
                'total_claims_amount': total_claims_amount,
                'loss_ratio': round(loss_ratio, 2),
                'pipeline': opportunities_by_stage,
                'pending_submissions': pending_submissions,
                'recent_activities': recent_activities,
                'upcoming_renewals': upcoming_renewals,
                'policy_distribution': policy_distribution,
                'recent_notifications': recent_notifications
            })
        except Exception as e:
            import traceback
            import sys
            print("==================================================")
            print("DASHBOARD STATS ERROR TRACEBACK:")
            traceback.print_exc(file=sys.stdout)
            print("==================================================")
            return Response({'error': str(e)}, status=500)

class AdvancedReportsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from datetime import datetime, timedelta
            from django.utils import timezone
            
            # Get time range parameter (month, quarter, year)
            time_range = request.query_params.get('range', 'month').lower()
            
            # Calculate date range
            today = timezone.now()
            if time_range == 'month':
                start_date = today - timedelta(days=30)
                period_label = 'This Month'
            elif time_range == 'quarter':
                start_date = today - timedelta(days=90)
                period_label = 'This Quarter'
            elif time_range == 'year':
                start_date = today - timedelta(days=365)
                period_label = 'This Year'
            else:
                start_date = today - timedelta(days=30)
                period_label = 'This Month'
            
            # 1. Customer Retention Rate
            # Find policies that expired in this period
            from operations.models import Policy
            expiring_policies = Policy.objects.filter(
                end_date__gte=start_date,
                end_date__lte=today
            )
            total_expiring = expiring_policies.count()
            
            # Find how many were renewed (assuming renewed policies have start_date near end_date of old policy)
            # For simplicity, we'll count ACTIVE policies as retained
            renewed_policies = expiring_policies.filter(status='ACTIVE').count()
            
            customer_retention = round((renewed_policies / total_expiring * 100) if total_expiring > 0 else 0, 2)
            
            # 2. Average Claim Processing Time
            from claims.models import Claim
            processed_claims = Claim.objects.filter(
                created_at__gte=start_date,
                created_at__lte=today
            ).exclude(status='PENDING')
            
            total_processing_days = 0
            claims_count = 0
            
            for claim in processed_claims:
                if claim.updated_at and claim.created_at:
                    processing_time = (claim.updated_at - claim.created_at).days
                    total_processing_days += processing_time
                    claims_count += 1
            
            avg_claim_processing = round(total_processing_days / claims_count, 1) if claims_count > 0 else 0
            
            # 3. Performance data (weekly breakdown for charts)
            performance_data = []
            
            if time_range == 'month':
                # Show 4 weeks
                num_periods = 4
                period_days = 7
                period_label_prefix = 'Week'
            elif time_range == 'quarter':
                # Show 12 weeks (3 months)
                num_periods = 12
                period_days = 7
                period_label_prefix = 'Week'
            else:  # year
                # Show 12 months
                num_periods = 12
                period_days = 30
                period_label_prefix = 'Month'
            
            for i in range(num_periods):
                # Calculate periods going BACKWARDS from today
                period_end = today - timedelta(days=i * period_days)
                period_start = period_end - timedelta(days=period_days)
                
                week_premium = Policy.objects.filter(
                    created_at__gte=period_start,
                    created_at__lt=period_end,
                    status='ACTIVE'
                ).aggregate(total=Sum('premium_amount'))['total'] or 0
                
                week_claims = Claim.objects.filter(
                    created_at__gte=period_start,
                    created_at__lt=period_end
                ).aggregate(total=Sum('claim_amount'))['total'] or 0
                
                # Insert at beginning to show oldest first
                performance_data.insert(0, {
                    'name': f'{period_label_prefix} {num_periods - i}',
                    'sales': float(week_premium),
                    'claims': float(week_claims),
                    'amt': float(week_premium - week_claims)
                })
            
            return Response({
                'time_range': period_label,
                'customer_retention': customer_retention,
                'avg_claim_processing': avg_claim_processing,
                'total_premium': float(Policy.objects.filter(status='ACTIVE').aggregate(Sum('premium_amount'))['premium_amount__sum'] or 0),
                'performance_data': performance_data,
                'retention_change': '+2.1%',  # Mock for now, would need historical comparison
                'processing_benchmark': 'Top 10% industry speeds'  # Mock
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)
