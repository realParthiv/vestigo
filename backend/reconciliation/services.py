from operations.models import Policy
from operations.models import PremiumPayment
from .models import BankLine, BrokerageLine
from django.db.models import Q
from decimal import Decimal, InvalidOperation

class AutoReconcileService:
    @staticmethod
    def match_statement(statement_id):
        """
        Auto-match lines in the statement against active policies.
        Matching Logic:
        1. Payment number match in description/reference.
        2. Exact amount match against pending/overdue payments.
        3. Exact amount match to policy premium when unique.
        """
        lines = BankLine.objects.filter(statement_id=statement_id, status=BankLine.STATUS_UNMATCHED)
        matches_count = 0

        for line in lines:
            match_found = None

            # 1) Try payment number match
            payment_qs = PremiumPayment.objects.filter(status__in=[PremiumPayment.PAYMENT_STATUS_PENDING, PremiumPayment.PAYMENT_STATUS_OVERDUE])
            for payment in payment_qs.select_related('policy'):
                if payment.payment_number and (
                    payment.payment_number in (line.description or '') or
                    payment.payment_number in (line.reference or '')
                ):
                    match_found = payment.policy
                    break

            # 2) Exact amount match to pending/overdue payments
            if match_found is None:
                payment_candidates = payment_qs.filter(amount_due=line.amount)
                if payment_candidates.count() == 1:
                    match_found = payment_candidates.first().policy
                elif payment_candidates.count() > 1:
                    # Disambiguate using policy number in description/reference
                    for payment in payment_candidates:
                        if payment.policy.policy_number in (line.description or '') or payment.policy.policy_number in (line.reference or ''):
                            match_found = payment.policy
                            break

            # 3) Fallback to policy premium uniqueness
            if match_found is None:
                candidates = Policy.objects.filter(premium_amount=line.amount, status='ACTIVE')
                if candidates.count() == 1:
                    match_found = candidates.first()
                elif candidates.count() > 1:
                    for policy in candidates:
                        if policy.policy_number in (line.description or '') or (line.reference and policy.policy_number in line.reference):
                            match_found = policy
                            break

            if match_found:
                line.matched_policy = match_found
                line.status = BankLine.STATUS_MATCHED
                line.save()
                matches_count += 1
        
        return matches_count


class BrokerageReconcileService:
    @staticmethod
    def _to_decimal(value):
        if value is None or value == '':
            return None
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            return None

    @staticmethod
    def _calculate_expected(line):
        premium = BrokerageReconcileService._to_decimal(line.premium_amount)
        rate = BrokerageReconcileService._to_decimal(line.brokerage_rate)
        if premium is None or rate is None:
            return None
        return (premium * rate / Decimal('100')).quantize(Decimal('0.01'))

    @staticmethod
    def match_statement(statement_id, variance_tolerance=Decimal('1.00')):
        """Auto-match brokerage lines and detect variances.
        Variance tolerance default is 1.00 to account for rounding differences.
        Lines with amounts differing by more than tolerance are marked VARIANCE.
        """
        lines = BrokerageLine.objects.filter(statement_id=statement_id).select_related('matched_policy')
        matched_count = 0
        variance_count = 0

        print(f"\n[BROKERAGE] Processing statement {statement_id}")
        print(f"[BROKERAGE] Total lines: {lines.count()}")

        for line in lines:
            match_found = None

            # Try to find matching policy by policy number
            if line.policy_number:
                match_found = Policy.objects.filter(policy_number=line.policy_number).first()

            if match_found:
                line.matched_policy = match_found

            # Calculate expected brokerage
            expected = BrokerageReconcileService._calculate_expected(line)
            line.expected_brokerage_amount = expected

            # Get actual brokerage amount from CSV
            brokerage_amount = BrokerageReconcileService._to_decimal(line.brokerage_amount)

            print(f"[LINE {line.id}] Policy: {line.policy_number}, Premium: {line.premium_amount}, Rate: {line.brokerage_rate}, Expected: {expected}, Actual: {brokerage_amount}")

            # Determine line status based on match and variance
            if expected is not None and brokerage_amount is not None:
                # We have amounts, check for variance
                variance = (brokerage_amount - expected).quantize(Decimal('0.01'))
                line.variance_amount = variance
                
                print(f"[CALC] Variance: {variance}, Abs: {abs(variance)}, Tolerance: {variance_tolerance}")

                if abs(variance) <= variance_tolerance:
                    # Variance within tolerance
                    if match_found:
                        line.status = BrokerageLine.STATUS_MATCHED
                        matched_count += 1
                        print(f"[MATCHED] Within tolerance")
                    else:
                        line.status = BrokerageLine.STATUS_UNMATCHED
                        print(f"[UNMATCHED] No policy found")
                else:
                    # Variance exceeds tolerance
                    line.status = BrokerageLine.STATUS_VARIANCE
                    variance_count += 1
                    print(f"[VARIANCE] Exceeds tolerance: {variance}")
            else:
                # Missing amounts - can't calculate variance
                print(f"[SKIP] Missing amounts: expected={expected}, brokerage={brokerage_amount}")
                if match_found:
                    line.status = BrokerageLine.STATUS_MATCHED
                    matched_count += 1
                else:
                    line.status = BrokerageLine.STATUS_UNMATCHED

            line.save()

        print(f"[SUMMARY] Statement {statement_id}: Matched={matched_count}, Variance={variance_count}\n")
        return matched_count
