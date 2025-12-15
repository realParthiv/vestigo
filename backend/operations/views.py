from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Policy
from .serializers import PolicySerializer

class PolicyViewSet(viewsets.ModelViewSet):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'policy_type', 'customer']
    search_fields = ['policy_number', 'customer__first_name', 'customer__last_name', 'customer__company_name']
    ordering_fields = ['start_date', 'end_date', 'premium_amount']
    
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
            
            # Build comprehensive response
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
                'payments': [{
                    'id': payment.id,
                    'payment_number': payment.payment_number,
                    'due_date': payment.due_date,
                    'paid_date': payment.paid_date,
                    'amount_due': str(payment.amount_due),
                    'amount_paid': str(payment.amount_paid) if payment.amount_paid else None,
                    'status': payment.status,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'is_overdue': payment.is_overdue,
                    'days_overdue': payment.days_overdue,
                    'notes': payment.notes
                } for payment in payments],
                'statistics': {
                    'total_claims': claims.count(),
                    'approved_claims': claims.filter(status='APPROVED').count(),
                    'pending_claims': claims.filter(status='SUBMITTED').count(),
                    'total_claimed_amount': str(sum(c.claim_amount for c in claims)),
                    'policy_duration_days': (policy.end_date - policy.start_date).days if policy.end_date and policy.start_date else 0,
                    'total_payments': payments.count(),
                    'paid_payments': payments.filter(status='PAID').count(),
                    'pending_payments': payments.filter(status='PENDING').count(),
                    'overdue_payments': sum(1 for p in payments if p.is_overdue),
                    'total_paid_amount': str(sum(p.amount_paid or 0 for p in payments)),
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
