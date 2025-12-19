from operations.models import Policy
from operations.models import PremiumPayment
from .models import BankLine
from django.db.models import Q

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
