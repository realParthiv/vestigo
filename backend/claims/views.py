from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from .models import Claim
from core.permissions import RolePermission
from users.models import Role
from .serializers import ClaimSerializer

class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.filter(is_active=True).select_related('policy', 'policy__customer').order_by('-created_at')
    serializer_class = ClaimSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.CLAIMS, Role.OPERATIONS]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'policy']
    search_fields = ['claim_number', 'policy__policy_number', 'policy__customer__first_name']
    ordering_fields = ['incident_date', 'claim_amount']

    @action(detail=True, methods=['post'], url_path='set-status')
    def set_status(self, request, pk=None):
        claim = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note')
        allowed = [s for s, _ in claim.STATUS_CHOICES]

        if new_status not in allowed:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce strict transitions
        valid_transitions = {
            Claim.STATUS_SUBMITTED: {Claim.STATUS_IN_REVIEW, Claim.STATUS_REJECTED},
            Claim.STATUS_IN_REVIEW: {Claim.STATUS_APPROVED, Claim.STATUS_REJECTED},
            Claim.STATUS_APPROVED: {Claim.STATUS_PAID, Claim.STATUS_REJECTED},
            Claim.STATUS_REJECTED: set(),
            Claim.STATUS_PAID: set(),
        }

        if new_status not in valid_transitions.get(claim.status, set()):
            return Response({'error': f'Cannot move from {claim.status} to {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

        # Note is always required for auditability
        if not note:
            return Response({'error': 'note is required for status changes'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle amount validation
        if new_status == Claim.STATUS_APPROVED:
            approved_amount_raw = request.data.get('approved_amount')
            if approved_amount_raw is None:
                return Response({'error': 'approved_amount required when approving'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                approved_amount = Decimal(str(approved_amount_raw))
            except (InvalidOperation, TypeError):
                return Response({'error': 'approved_amount must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)

            if approved_amount <= 0:
                return Response({'error': 'approved_amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            if claim.claim_amount and approved_amount > claim.claim_amount:
                return Response({'error': 'approved_amount cannot exceed claimed amount'}, status=status.HTTP_400_BAD_REQUEST)

            claim.approved_amount = approved_amount

        if new_status == Claim.STATUS_PAID:
            paid_amount_raw = request.data.get('paid_amount') or request.data.get('approved_amount')
            approved_amount_raw = request.data.get('approved_amount') or claim.approved_amount

            if paid_amount_raw is None:
                return Response({'error': 'paid_amount required when marking paid'}, status=status.HTTP_400_BAD_REQUEST)
            if approved_amount_raw is None:
                return Response({'error': 'approved_amount required before marking paid'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                paid_amount = Decimal(str(paid_amount_raw))
            except (InvalidOperation, TypeError):
                return Response({'error': 'paid_amount must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                approved_amount = Decimal(str(approved_amount_raw))
            except (InvalidOperation, TypeError):
                return Response({'error': 'approved_amount must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)

            if approved_amount <= 0:
                return Response({'error': 'approved_amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            if claim.claim_amount and approved_amount > claim.claim_amount:
                return Response({'error': 'approved_amount cannot exceed claimed amount'}, status=status.HTTP_400_BAD_REQUEST)
            if paid_amount <= 0:
                return Response({'error': 'paid_amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            if paid_amount > approved_amount:
                return Response({'error': 'paid_amount cannot exceed approved amount'}, status=status.HTTP_400_BAD_REQUEST)

            claim.approved_amount = approved_amount  # Persist approved amount if provided here
            claim.paid_amount = paid_amount
            claim.payout_date = request.data.get('payout_date') or timezone.now().date()

        claim.status_note = note
        claim.status = new_status
        claim.save()

        serializer = self.get_serializer(claim)
        return Response(serializer.data)
