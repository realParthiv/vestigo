from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Submission
from .serializers import SubmissionSerializer
from operations.models import Policy

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        submission = self.get_object()
        if submission.status != Submission.STATUS_PENDING:
            return Response({'error': 'Only pending submissions can be approved'}, status=status.HTTP_400_BAD_REQUEST)

        # Update Submission
        submission.status = Submission.STATUS_APPROVED
        submission.underwriter = request.user
        submission.save()

        # Logic to Auto-Create Policy upon Approval
        # Assuming Policy is created from Opportunity data
        opp = submission.opportunity
        policy = Policy.objects.create(
            customer=opp.lead,
            policy_number=f"POL-{opp.id}-{int(timezone.now().timestamp())}",
            policy_type='HEALTH', # Default or derived from Opp
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=365),
            premium_amount=opp.expected_revenue,
            status=Policy.STATUS_ACTIVE
        )

        return Response({'status': 'approved', 'policy_id': policy.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        submission = self.get_object()
        submission.status = Submission.STATUS_REJECTED
        submission.underwriter = request.user
        submission.save()
        return Response({'status': 'rejected'})
