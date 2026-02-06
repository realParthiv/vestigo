from rest_framework import viewsets, status, decorators
from rest_framework.response import Response
from .models import BankStatement, BankLine, BrokerageStatement, BrokerageLine
from .serializers import BankStatementSerializer, BankLineSerializer, BrokerageStatementSerializer, BrokerageLineSerializer
from .services import AutoReconcileService, BrokerageReconcileService
from operations.models import Policy
from core.permissions import RolePermission
from users.models import Role
import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation
from django.utils import timezone

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
        policy_number = request.data.get('policy_number')

        try:
            policy = None
            if policy_id:
                policy = Policy.objects.get(id=policy_id)
            elif policy_number:
                policy = Policy.objects.get(policy_number=policy_number)
            elif isinstance(policy_id, str) and policy_id.startswith('POL-'):
                policy = Policy.objects.get(policy_number=policy_id)
            else:
                return Response({'error': 'Provide policy_id or policy_number'}, status=status.HTTP_400_BAD_REQUEST)

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


class BrokerageStatementViewSet(viewsets.ModelViewSet):
    queryset = BrokerageStatement.objects.all()
    serializer_class = BrokerageStatementSerializer
    permission_classes = [RolePermission]
    allowed_roles = [Role.ADMIN, Role.FINANCE]

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def _parse_decimal(value):
        if value is None or value == '':
            return None
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            return None

    @decorators.action(detail=False, methods=['post'])
    def upload_csv(self, request):
        """
        Expected Header (flexible):
        Date, PolicyNumber/Policy Number, Premium/PremiumAmount, BrokerageRate/Brokerage %, BrokerageAmount/Brokerage, Reference
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        input_name = request.data.get('name') or file.name
        if BrokerageStatement.objects.filter(name=input_name).exists():
            return Response({'error': f'Statement with name "{input_name}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        statement_name = input_name
        if not request.data.get('name'):
            statement_name = f"Brokerage Import {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        statement = BrokerageStatement.objects.create(
            name=statement_name,
            insurer_name=request.data.get('insurer_name'),
            file=file
        )

        def get_value(row, *keys):
            for key in keys:
                if key in row and row[key] != '':
                    return row[key]
            return None

        lines_created = 0
        for row in reader:
            try:
                BrokerageLine.objects.create(
                    statement=statement,
                    date=self._parse_date(get_value(row, 'Date', 'date')),
                    policy_number=get_value(row, 'Policy Number', 'PolicyNumber', 'policy_number'),
                    premium_amount=self._parse_decimal(get_value(row, 'Premium', 'PremiumAmount', 'premium_amount')),
                    brokerage_rate=self._parse_decimal(get_value(row, 'Brokerage %', 'BrokerageRate', 'brokerage_rate')),
                    brokerage_amount=self._parse_decimal(get_value(row, 'Brokerage Amount', 'Brokerage', 'BrokerageAmount', 'brokerage_amount')),
                    reference=get_value(row, 'Reference', 'reference')
                )
                lines_created += 1
            except Exception as e:
                print(f"Skipping row {row}: {e}")

        matches = BrokerageReconcileService.match_statement(statement.id)

        return Response({
            'status': 'success',
            'statement_id': statement.id,
            'lines_processed': lines_created,
            'auto_matches': matches
        })

    @decorators.action(detail=True, methods=['post'])
    def auto_match(self, request, pk=None):
        count = BrokerageReconcileService.match_statement(pk)
        return Response({'matches_found': count})


class BrokerageLineViewSet(viewsets.ModelViewSet):
    queryset = BrokerageLine.objects.all()
    serializer_class = BrokerageLineSerializer
    permission_classes = [RolePermission]
    allowed_roles = [Role.ADMIN, Role.FINANCE]

    @decorators.action(detail=True, methods=['post'])
    def manual_match(self, request, pk=None):
        line = self.get_object()
        policy_number = request.data.get('policy_number')
        policy_id = request.data.get('policy_id')

        try:
            policy = None
            if policy_id:
                policy = Policy.objects.get(id=policy_id)
            elif policy_number:
                policy = Policy.objects.get(policy_number=policy_number)
            else:
                return Response({'error': 'Provide policy_number or policy_id'}, status=status.HTTP_400_BAD_REQUEST)

            line.matched_policy = policy
            if policy_number:
                line.policy_number = policy_number
            line.status = BrokerageLine.STATUS_MATCHED
            line.save()

            BrokerageReconcileService.match_statement(line.statement_id)
            return Response({'status': 'matched', 'policy': policy.policy_number})
        except Policy.DoesNotExist:
            return Response({'error': 'Policy not found'}, status=404)

    @decorators.action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        line = self.get_object()
        line.status = BrokerageLine.STATUS_APPROVED
        line.approved_by = request.user
        line.approved_at = timezone.now()
        line.approval_note = request.data.get('approval_note', '')
        line.save()
        return Response({'status': 'approved'})
