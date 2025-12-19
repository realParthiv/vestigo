from decimal import Decimal
from datetime import timedelta

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Submission
from core.permissions import RolePermission
from users.models import Role
from .serializers import SubmissionSerializer
from operations.models import Policy

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.filter(is_active=True)
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = [Role.ADMIN, Role.UNDERWRITER]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            submission = self.get_object()
            if submission.status != Submission.STATUS_PENDING:
                return Response({'error': 'Only pending submissions can be approved'}, status=status.HTTP_400_BAD_REQUEST)

            # Update Submission
            submission.status = Submission.STATUS_APPROVED
            submission.underwriter = request.user
            submission.save()
            print(f"[APPROVE] Submission {submission.id} marked APPROVED")

            # Logic to Auto-Create Policy upon Approval
            # Assuming Policy is created from Opportunity data
            opp = submission.opportunity
            if not opp:
                return Response({'error': 'Submission has no opportunity'}, status=status.HTTP_400_BAD_REQUEST)
            
            start_date = timezone.now().date()
            policy = Policy.objects.create(
                customer=opp.lead,
                policy_number=f"POL-{opp.id}-{int(timezone.now().timestamp())}",
                policy_type='HEALTH',  # Default or derived from Opp
                start_date=start_date,
                end_date=start_date + timedelta(days=365),
                premium_amount=opp.expected_revenue or Decimal('0'),
                status=Policy.STATUS_ACTIVE,
            )
            print(f"[APPROVE] Policy created: {policy.policy_number} (ID: {policy.id}, is_active: {policy.is_active})")

            return Response({'status': 'approved', 'policy_id': policy.id, 'policy_number': policy.policy_number})
        except Exception as e:
            print(f"[APPROVE ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        submission = self.get_object()
        if submission.status != Submission.STATUS_PENDING:
            return Response({'error': 'Only pending submissions can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        submission.status = Submission.STATUS_REJECTED
        submission.underwriter = request.user
        submission.save()
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], url_path='request-info')
    def request_info(self, request, pk=None):
        submission = self.get_object()
        if submission.status != Submission.STATUS_PENDING:
            return Response({'error': 'Only pending submissions can request more info'}, status=status.HTTP_400_BAD_REQUEST)
        submission.status = Submission.STATUS_MORE_INFO
        submission.underwriter = request.user
        submission.notes = request.data.get('notes', submission.notes)
        submission.save()
        return Response({'status': 'more_info_requested'})
