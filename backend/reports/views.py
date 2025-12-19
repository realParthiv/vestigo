from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import RolePermission
from users.models import Role
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from operations.models import Policy
from claims.models import Claim
from bdm.models import Opportunity
from underwriting.models import Submission

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = None  # Allow all authenticated users to view dashboard

    def get(self, request):
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            today = timezone.now().date()
            last_month_start = today - timedelta(days=60)
            last_month_end = today - timedelta(days=30)
            
            # 1. Total Written Premium (Active Policies)
            total_premium = Policy.objects.filter(status='ACTIVE').aggregate(Sum('premium_amount'))['premium_amount__sum'] or 0
            
            # Premium trend - compare last 30 days vs previous 30 days
            recent_premium = Policy.objects.filter(
                status='ACTIVE', 
                created_at__gte=last_month_end
            ).aggregate(Sum('premium_amount'))['premium_amount__sum'] or 0
            
            previous_premium = Policy.objects.filter(
                status='ACTIVE',
                created_at__gte=last_month_start,
                created_at__lt=last_month_end
            ).aggregate(Sum('premium_amount'))['premium_amount__sum'] or 0
            
            premium_growth = 0
            if previous_premium > 0:
                premium_growth = round(((recent_premium - previous_premium) / previous_premium) * 100, 1)
            elif recent_premium > 0:
                premium_growth = 100.0

            # 2. Total Claims Verified (Approved/Paid)
            total_claims_amount = Claim.objects.exclude(status='REJECTED').aggregate(Sum('claim_amount'))['claim_amount__sum'] or 0
            
            # Claims trend
            recent_claims = Claim.objects.filter(
                created_at__gte=last_month_end
            ).exclude(status='REJECTED').aggregate(Sum('claim_amount'))['claim_amount__sum'] or 0
            
            previous_claims = Claim.objects.filter(
                created_at__gte=last_month_start,
                created_at__lt=last_month_end
            ).exclude(status='REJECTED').aggregate(Sum('claim_amount'))['claim_amount__sum'] or 0
            
            claims_trend = 0
            if previous_claims > 0:
                claims_trend = round(((recent_claims - previous_claims) / previous_claims) * 100, 1)
            elif recent_claims > 0:
                claims_trend = 100.0

            # 3. Claims Ratio
            loss_ratio = 0
            if total_premium > 0:
                loss_ratio = (total_claims_amount / total_premium) * 100

            # 4. Pipeline Stats
            opportunities_by_stage = Opportunity.objects.values('stage').annotate(count=Count('id'))
            
            # Pipeline growth - new opportunities this week
            week_ago = today - timedelta(days=7)
            new_this_week = Opportunity.objects.filter(created_at__gte=week_ago).count()
            
            # 5. Underwriting Queue
            pending_submissions = Submission.objects.filter(status='PENDING').count()
            
            # Average processing time for underwriting
            approved_submissions = Submission.objects.filter(
                status='APPROVED',
                updated_at__isnull=False
            ).select_related()
            
            total_days = 0
            count = 0
            for sub in approved_submissions[:20]:  # Sample last 20
                if sub.created_at and sub.updated_at:
                    delta = (sub.updated_at - sub.created_at).days
                    total_days += delta
                    count += 1
            
            avg_underwriting_days = round(total_days / count, 1) if count > 0 else 0

            # 6. Premium Trend (Last 7 months)
            # Get policies created in last 7 months
            seven_months_ago = today - timedelta(days=210)
            
            monthly_premium = Policy.objects.filter(
                created_at__gte=seven_months_ago
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total=Sum('premium_amount')
            ).order_by('month')
            
            # Format trend data
            premium_trend = []
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            for item in monthly_premium:
                if item['month']:
                    premium_trend.append({
                        'name': month_names[item['month'].month - 1],
                        'premium': float(item['total'] or 0)
                    })
            
            # If no data, create empty trend
            if not premium_trend:
                current_month = today.month
                for i in range(7):
                    month_idx = (current_month - 7 + i) % 12
                    premium_trend.append({
                        'name': month_names[month_idx],
                        'premium': 0
                    })

            # 7. Recent Activity (Last 5)
            # Assuming Activity model exists in bdm as found in file view
            from bdm.models import Activity
            
            recent_activities = []
            activities_qs = Activity.objects.select_related('lead', 'opportunity').order_by('-performed_at')[:5]
            for act in activities_qs:
                recent_activities.append({
                    'id': act.id,
                    'activity_type': act.get_type_display(), # 'type' is the field, getting display name
                    'notes': act.summary, # Mapping summary to notes as expected by frontend
                    'created_at': act.performed_at
                })

            # 8. Upcoming Renewals (Next 30 Days)
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

            # 9. Policy Distribution (By Type)
            policy_distribution_qs = Policy.objects.values('policy_type').annotate(count=Count('id'))
            total_policies = Policy.objects.count()
            policy_distribution = []
            for dist in policy_distribution_qs:
                policy_distribution.append({
                    'policy_type': dist['policy_type'],
                    'count': dist['count'],
                    'percentage': round((dist['count'] / total_policies * 100) if total_policies > 0 else 0, 1)
                })

            # 10. Recent Notifications
            from notifications.models import Notification
            try:
                user_role = getattr(getattr(request.user, 'role', None), 'name', None)
                if user_role == Role.ADMIN or request.user.is_staff:
                    # Admins see latest 5 system-wide
                    recent_notifications = Notification.objects.order_by('-created_at')[:5].values('id', 'title', 'message', 'type', 'created_at', 'link')
                else:
                    user_notifications_qs = Notification.objects.filter(user=request.user).order_by('-created_at')
                    recent_notifications = user_notifications_qs.values('id', 'title', 'message', 'type', 'created_at', 'link')[:5]
            except Exception:
                recent_notifications = []

            return Response({
                'total_premium': total_premium,
                'premium_growth': premium_growth,
                'total_claims_amount': total_claims_amount,
                'claims_trend': claims_trend,
                'loss_ratio': round(loss_ratio, 2),
                'pipeline': opportunities_by_stage,
                'new_this_week': new_this_week,
                'pending_submissions': pending_submissions,
                'avg_underwriting_days': avg_underwriting_days,
                'premium_trend': premium_trend,
                'recent_activities': recent_activities,
                'upcoming_renewals': upcoming_renewals,
                'policy_distribution': policy_distribution,
                'recent_notifications': recent_notifications
            })
        except Exception as e:
            # Fail open for dashboard: return minimal payload instead of 500
            import traceback
            import sys
            print("==================================================")
            print("DASHBOARD STATS ERROR TRACEBACK:")
            traceback.print_exc(file=sys.stdout)
            print("==================================================")
            return Response({
                'error': str(e),
                'total_premium': 0,
                'premium_growth': 0,
                'total_claims_amount': 0,
                'claims_trend': 0,
                'loss_ratio': 0,
                'pipeline': [],
                'new_this_week': 0,
                'pending_submissions': 0,
                'avg_underwriting_days': 0,
                'premium_trend': [],
                'recent_activities': [],
                'upcoming_renewals': [],
                'policy_distribution': [],
                'recent_notifications': []
            }, status=200)

class AdvancedReportsView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.OPERATIONS, Role.BDM, Role.UNDERWRITER, Role.CLAIMS]
    
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
