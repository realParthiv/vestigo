from rest_framework import viewsets, status, decorators
from rest_framework.response import Response
from .models import BankStatement, BankLine
from .serializers import BankStatementSerializer, BankLineSerializer
from .services import AutoReconcileService
from operations.models import Policy
from core.permissions import RolePermission
from users.models import Role
import csv
import io
from datetime import datetime

class BankStatementViewSet(viewsets.ModelViewSet):
    queryset = BankStatement.objects.all()
    serializer_class = BankStatementSerializer
    permission_classes = [RolePermission]
    allowed_roles = [Role.ADMIN, Role.FINANCE]

    @decorators.action(detail=False, methods=['post'])
    def upload_csv(self, request):
        """
        Accepts a generic CSV upload with optional file storage.
        Expected Header: Date, Description, Amount, Reference
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        input_name = request.data.get('name') or file.name
        if BankStatement.objects.filter(name=input_name).exists():
             return Response({'error': f'Statement with name "{input_name}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        statement_name = input_name
        if not request.data.get('name'):
             statement_name = f"Import {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Save file reference
        statement = BankStatement.objects.create(name=statement_name, file=file)

        lines_created = 0
        for row in reader:
            try:
                BankLine.objects.create(
                    statement=statement,
                    date=datetime.strptime(row.get('Date'), '%Y-%m-%d').date(),
                    description=row.get('Description', ''),
                    amount=row.get('Amount', 0),
                    reference=row.get('Reference', '')
                )
                lines_created += 1
            except Exception as e:
                print(f"Skipping row {row}: {e}")

        # Run Auto Match immediately
        matches = AutoReconcileService.match_statement(statement.id)

        return Response({
            'status': 'success', 
            'statement_id': statement.id, 
            'lines_processed': lines_created,
            'auto_matches': matches
        })

    @decorators.action(detail=True, methods=['post'])
    def auto_match(self, request, pk=None):
        count = AutoReconcileService.match_statement(pk)
        return Response({'matches_found': count})

class BankLineViewSet(viewsets.ModelViewSet):
    queryset = BankLine.objects.all()
    serializer_class = BankLineSerializer
    permission_classes = [RolePermission]
    allowed_roles = [Role.ADMIN, Role.FINANCE]

    @decorators.action(detail=True, methods=['post'])
    def manual_match(self, request, pk=None):
        """
        Manually link a policy ID to this line.
        """
        line = self.get_object()
        policy_id = request.data.get('policy_id')
        
        try:
            policy = Policy.objects.get(id=policy_id)
            line.matched_policy = policy
            line.status = BankLine.STATUS_MATCHED
            line.save()
            return Response({'status': 'matched', 'policy': policy.policy_number})
        except Policy.DoesNotExist:
            return Response({'error': 'Policy not found'}, status=404)

    @decorators.action(detail=True, methods=['post'])
    def unmatch(self, request, pk=None):
        line = self.get_object()
        line.matched_policy = None
        line.status = BankLine.STATUS_UNMATCHED
        line.save()
        return Response({'status': 'unmatched'})
