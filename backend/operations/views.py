from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.db import transaction
from .models import Policy, PremiumPayment, LateChargePolicy, LateCharge
from decimal import Decimal
from users.models import User
from notifications.models import Notification
from core.permissions import RolePermission
from users.models import Role
from .serializers import PolicySerializer, PremiumPaymentSerializer, LateChargePolicySerializer, LateChargeSerializer
from django.utils import timezone
from decimal import Decimal
import calendar

class PolicyViewSet(viewsets.ModelViewSet):
    queryset = Policy.objects.filter(is_active=True)  # Only show active (not soft-deleted) policies
    serializer_class = PolicySerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    # Allow underwriting to view/verify newly issued policies (read-only via UI)
    allowed_roles = [Role.ADMIN, Role.OPERATIONS, Role.UNDERWRITER]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'policy_type', 'customer']
    search_fields = ['policy_number', 'customer__first_name', 'customer__last_name', 'customer__company_name']
    ordering_fields = ['start_date', 'end_date', 'premium_amount']

    @action(detail=True, methods=['post'], url_path='generate-schedule')
    def generate_schedule(self, request, pk=None):
        policy = self.get_object()
        count = int(request.data.get('count', 12))
        start_date = request.data.get('start_date')
        frequency_days = int(request.data.get('frequency_days', 30))
        frequency = request.data.get('frequency', 'monthly')  # 'monthly' or 'days'

        if count <= 0:
            return Response({'error': 'count must be > 0'}, status=status.HTTP_400_BAD_REQUEST)

        # Default first due date: policy start_date if set, otherwise today
        base_date = policy.start_date or timezone.now().date()
        if start_date:
            try:
                base_date = timezone.datetime.fromisoformat(start_date).date()
            except ValueError:
                return Response({'error': 'start_date must be ISO formatted (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        # Replace any existing schedule to ensure the exact requested count
        policy.payments.all().delete()

        # Basic even split; remainder to first installment
        total = Decimal(str(policy.premium_amount or 0))
        base = (total / count).quantize(Decimal('0.01')) if count else Decimal('0')
        remainder = total - (base * count)

        created = []

        def add_months(date_obj, months):
            # Calendar-aware month increment; clamps to last day of target month
            month = date_obj.month - 1 + months
            year = date_obj.year + month // 12
            month = month % 12 + 1
            day = min(date_obj.day, calendar.monthrange(year, month)[1])
            return date_obj.replace(year=year, month=month, day=day)

        for i in range(count):
            amount = base + (remainder if i == 0 else Decimal('0.00'))
            if frequency == 'monthly':
                due_date = add_months(base_date, i)
            else:
                due_date = base_date + timezone.timedelta(days=frequency_days * i)

            payment = PremiumPayment.objects.create(
                policy=policy,
                payment_number=f"PAY-{policy.id}-{int(timezone.now().timestamp())}-{i+1}",
                due_date=due_date,
                amount_due=amount,
                status=PremiumPayment.PAYMENT_STATUS_PENDING,
            )
            created.append(payment.id)

        serialized = PremiumPaymentSerializer(PremiumPayment.objects.filter(id__in=created), many=True).data
        return Response({'created': serialized})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        policy = self.get_object()
        policy.status = Policy.STATUS_CANCELLED
        policy.save()
        return Response({'status': 'cancelled'})

    @action(detail=True, methods=['post'], url_path='expire')
    def expire(self, request, pk=None):
        policy = self.get_object()
        policy.status = Policy.STATUS_EXPIRED
        policy.save()
        return Response({'status': 'expired'})
    
    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        """
        Get comprehensive policy details including customer, claims, and payment history
        """
        try:
            policy = self.get_object()
            
            # Get related data
            customer = policy.customer
            claims = policy.claims.all().order_by('-created_at')
            payments = policy.payments.all().order_by('-due_date')

            # Compute overdue dynamically based on today's date to ensure UI matches real world
            today = timezone.now().date()
            payments_data = []
            overdue_count = 0
            paid_count = 0
            pending_count = 0
            total_paid_amount = 0

            for payment in payments:
                overdue = (payment.status != PremiumPayment.PAYMENT_STATUS_PAID) and (payment.due_date < today)
                if overdue:
                    overdue_count += 1
                if payment.status == PremiumPayment.PAYMENT_STATUS_PAID:
                    paid_count += 1
                # Pending should not count those that are actually overdue
                if payment.status == PremiumPayment.PAYMENT_STATUS_PENDING and not overdue:
                    pending_count += 1

                total_paid_amount += float(payment.amount_paid or 0)

                days_overdue = (today - payment.due_date).days if overdue else 0
                status_value = payment.status
                if overdue and payment.status != PremiumPayment.PAYMENT_STATUS_OVERDUE:
                    status_value = PremiumPayment.PAYMENT_STATUS_OVERDUE

                payments_data.append({
                    'id': payment.id,
                    'payment_number': payment.payment_number,
                    'due_date': payment.due_date,
                    'paid_date': payment.paid_date,
                    'amount_due': str(payment.amount_due),
                    'amount_paid': str(payment.amount_paid) if payment.amount_paid else None,
                    'status': status_value,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'is_overdue': overdue,
                    'days_overdue': days_overdue,
                    'notes': payment.notes
                })

            # Build comprehensive response
            # Aggregate claim amounts with safe defaults
            total_claimed_amount = sum((c.claim_amount or 0) for c in claims)
            total_approved_amount = sum((c.approved_amount or 0) for c in claims)
            total_paid_claim_amount = sum((c.paid_amount or 0) for c in claims)

            # Compute coverage/claim thresholds
            premium_amount = Decimal(str(policy.premium_amount or 0))
            claim_exceeds_premium = Decimal(str(total_approved_amount)) > premium_amount
            remaining_coverage = (premium_amount - Decimal(str(total_approved_amount))) if premium_amount > 0 else Decimal('0')

            response_data = {
                'policy': {
                    'id': policy.id,
                    'policy_number': policy.policy_number,
                    'policy_type': policy.policy_type,
                    'status': policy.status,
                    'premium_amount': str(policy.premium_amount),
                    'start_date': policy.start_date,
                    'end_date': policy.end_date,
                    'created_at': policy.created_at,
                    'updated_at': policy.updated_at
                },
                'customer': {
                    'id': customer.id,
                    'first_name': customer.first_name,
                    'last_name': customer.last_name,
                    'email': customer.email,
                    'phone': customer.phone,
                    'company_name': customer.company_name or '',
                    'status': customer.status
                },
                'claims': [{
                    'id': claim.id,
                    'claim_number': claim.claim_number,
                    'incident_date': claim.incident_date,
                    'claim_amount': str(claim.claim_amount),
                    'approved_amount': str(claim.approved_amount) if claim.approved_amount else None,
                    'status': claim.status,
                    'description': claim.description,
                    'created_at': claim.created_at
                } for claim in claims],
                'payments': payments_data,
                'statistics': {
                    'total_claims': claims.count(),
                    'approved_claims': claims.filter(status='APPROVED').count(),
                    'paid_claims': claims.filter(status='PAID').count(),
                    'pending_claims': claims.filter(status='SUBMITTED').count(),
                    'total_claimed_amount': str(total_claimed_amount),
                    'total_approved_claim_amount': str(total_approved_amount),
                    'total_paid_claim_amount': str(total_paid_claim_amount),
                    'claim_exceeds_premium': claim_exceeds_premium,
                    'remaining_coverage': str(remaining_coverage if remaining_coverage > 0 else Decimal('0')),
                    'policy_duration_days': (policy.end_date - policy.start_date).days if policy.end_date and policy.start_date else 0,
                    'total_payments': payments.count(),
                    'paid_payments': paid_count,
                    'pending_payments': pending_count,
                    'overdue_payments': overdue_count,
                    'total_paid_amount': str(total_paid_amount),
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PremiumPaymentViewSet(viewsets.ModelViewSet):
    queryset = PremiumPayment.objects.all()
    serializer_class = PremiumPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    # Allow underwriting to view payment schedules for verification purposes
    allowed_roles = [Role.ADMIN, Role.OPERATIONS, Role.FINANCE, Role.UNDERWRITER]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'policy']
    search_fields = ['payment_number', 'policy__policy_number']
    ordering_fields = ['due_date', 'amount_due']

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        payment = self.get_object()
        amount = request.data.get('amount', payment.amount_due)
        method = request.data.get('payment_method', payment.payment_method)
        txn = request.data.get('transaction_id')
        payment.mark_as_paid(amount=amount, payment_method=method, transaction_id=txn)
        return Response({'status': 'paid'})

    @action(detail=True, methods=['post'], url_path='mark-failed')
    def mark_failed(self, request, pk=None):
        payment = self.get_object()
        payment.status = PremiumPayment.PAYMENT_STATUS_FAILED
        payment.save()
        return Response({'status': 'failed'})
    @action(detail=False, methods=['post'], url_path='refresh-overdue')
    def refresh_overdue(self, request):
        today = timezone.now().date()
        # 1) Mark past-due payments as OVERDUE (use save to trigger signals)
        to_mark_overdue = PremiumPayment.objects.filter(
            status__in=[PremiumPayment.PAYMENT_STATUS_PENDING, PremiumPayment.PAYMENT_STATUS_FAILED],
            due_date__lt=today
        ).select_related('policy')

        for payment in to_mark_overdue:
            if payment.status != PremiumPayment.PAYMENT_STATUS_OVERDUE:
                payment.status = PremiumPayment.PAYMENT_STATUS_OVERDUE
                payment.save()  # Triggers post_save signal to notify OPERATIONS

                # Proactively notify ADMIN role as well
                admin_role = Role.objects.filter(name=Role.ADMIN).first()
                if admin_role:
                    admin_users = User.objects.filter(role=admin_role, is_active=True)
                    if admin_users.exists():
                        days_overdue = (today - payment.due_date).days
                        for admin in admin_users:
                            Notification.objects.create(
                                user=admin,
                                title="Payment Overdue",
                                message=f"Payment {payment.payment_number} is {days_overdue} days overdue",
                                type=Notification.TYPE_WARNING,
                                link=f"/policies/{payment.policy.id}"
                            )
        return Response({'overdue_updated': updated})


class LateChargePolicyViewSet(viewsets.ModelViewSet):
    """Admin ViewSet for managing late charge policies."""
    queryset = LateChargePolicy.objects.all()
    serializer_class = LateChargePolicySerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.OPERATIONS]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'charge_type', 'trigger_type']
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class LateChargeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing applied late charges."""
    queryset = LateCharge.objects.all().select_related(
        'payment', 
        'policy', 
        'policy__customer',
        'charge_policy',
        'waived_by'
    ).order_by('-created_at')
    serializer_class = LateChargeSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.OPERATIONS]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['policy', 'waived', 'is_paid']
    search_fields = ['payment__payment_number', 'policy__policy_number', 'policy__customer__first_name', 'policy__customer__last_name']
    
    @action(detail=True, methods=['post'])
    def waive(self, request, pk=None):
        """Admin action to waive a late charge."""
        late_charge = self.get_object()
        reason = request.data.get('reason', '')
        
        late_charge.waived = True
        late_charge.waived_by = request.user
        late_charge.waived_reason = reason
        late_charge.waived_date = timezone.now().date()
        late_charge.save()
        
        return Response({'status': 'waived', 'message': 'Late charge has been waived'})
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark late charge as paid."""
        late_charge = self.get_object()
        
        late_charge.is_paid = True
        late_charge.paid_date = timezone.now().date()
        late_charge.save()
        
        return Response({'status': 'paid', 'message': 'Late charge marked as paid'})

    def _refresh_overdue_and_apply(self):
        """Ensure overdue statuses and late charges are up to date before listing."""
        today = timezone.now().date()

        # 1) Mark past-due payments as OVERDUE (use save to trigger signals)
        to_mark_overdue = PremiumPayment.objects.filter(
            status__in=[PremiumPayment.PAYMENT_STATUS_PENDING, PremiumPayment.PAYMENT_STATUS_FAILED],
            due_date__lt=today
        ).select_related('policy')

        for payment in to_mark_overdue:
            if payment.status != PremiumPayment.PAYMENT_STATUS_OVERDUE:
                payment.status = PremiumPayment.PAYMENT_STATUS_OVERDUE
                payment.save()  # Triggers post_save signal to notify OPERATIONS

                # Proactively notify ADMIN role as well
                admin_role = Role.objects.filter(name=Role.ADMIN).first()
                if admin_role:
                    admin_users = User.objects.filter(role=admin_role, is_active=True)
                    if admin_users.exists():
                        days_overdue = (today - payment.due_date).days
                        for admin in admin_users:
                            Notification.objects.create(
                                user=admin,
                                title="Payment Overdue",
                                message=f"Payment {payment.payment_number} is {days_overdue} days overdue",
                                type=Notification.TYPE_WARNING,
                                link=f"/policies/{payment.policy.id}"
                            )

        # 2) Apply late charges for overdue payments with no charge yet
        active_policies = list(LateChargePolicy.objects.filter(is_active=True))
        if not active_policies:
            return

        overdue_payments = PremiumPayment.objects.filter(
            status=PremiumPayment.PAYMENT_STATUS_OVERDUE,
            late_charge__isnull=True
        ).select_related('policy')

        for payment in overdue_payments:
            days_overdue = (today - payment.due_date).days

            # Apply the first active policy without enforcing trigger thresholds
            for policy in active_policies:
                if policy.charge_type == LateChargePolicy.CHARGE_TYPE_PERCENTAGE:
                    charge_amount = (Decimal(str(payment.amount_due)) * Decimal(str(policy.charge_amount)) / Decimal('100')).quantize(Decimal('0.01'))
                else:
                    charge_amount = Decimal(str(policy.charge_amount)).quantize(Decimal('0.01'))

                if policy.maximum_charge_per_payment:
                    charge_amount = min(charge_amount, Decimal(str(policy.maximum_charge_per_payment)).quantize(Decimal('0.01')))

                if charge_amount > 0:
                    with transaction.atomic():
                        # Recheck to avoid race/duplicates
                        if LateCharge.objects.filter(payment=payment).exists():
                            break
                        LateCharge.objects.create(
                            payment=payment,
                            policy=payment.policy,
                            charge_policy=policy,
                            charge_amount=charge_amount,
                            reason=f"Late payment by {days_overdue} days"
                        )
                    break

    def list(self, request, *args, **kwargs):
        # Keep late charges up to date whenever list is requested
        self._refresh_overdue_and_apply()
        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Admin can manually adjust the late charge amount."""
        late_charge = self.get_object()
        new_amount = request.data.get('amount')
        admin_notes = request.data.get('notes', '')
        
        if not new_amount:
            return Response({'error': 'Amount required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_amount = Decimal(str(new_amount)).quantize(Decimal('0.01'))
        except:
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
        
        late_charge.charge_amount = new_amount
        late_charge.admin_notes = admin_notes
        late_charge.save()
        
        return Response({'status': 'adjusted', 'message': 'Late charge amount adjusted', 'new_amount': str(new_amount)})
    
    @action(detail=False, methods=['post'], url_path='apply-policy')
    def apply_policy(self, request):
        """Apply a late charge policy to all overdue payments."""
        policy_id = request.data.get('policy_id')
        if not policy_id:
            return Response({'error': 'policy_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            charge_policy = LateChargePolicy.objects.get(id=policy_id, is_active=True)
        except LateChargePolicy.DoesNotExist:
            return Response({'error': 'Policy not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        
        created_count = 0
        today = timezone.now().date()
        
        # Find overdue payments (by date, not just status) that don't have late charges yet
        overdue_payments = PremiumPayment.objects.filter(
            late_charge__isnull=True,
        ).filter(
            models.Q(status=PremiumPayment.PAYMENT_STATUS_OVERDUE) |
            models.Q(status__in=[PremiumPayment.PAYMENT_STATUS_PENDING, PremiumPayment.PAYMENT_STATUS_FAILED], due_date__lt=today)
        )
        
        for payment in overdue_payments:
            days_overdue = (today - payment.due_date).days
            charge_amount = charge_policy.calculate_charge(payment, days_overdue)
            
            if charge_amount > 0:
                LateCharge.objects.create(
                    payment=payment,
                    policy=payment.policy,
                    charge_policy=charge_policy,
                    charge_amount=charge_amount,
                    reason=f"Late payment by {days_overdue} days"
                )
                created_count += 1
        
        return Response({
            'status': 'success',
            'late_charges_created': created_count,
            'message': f'Applied late charge policy to {created_count} overdue payments'
        })
