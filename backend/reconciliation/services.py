from operations.models import Policy
from .models import BankLine
from django.db.models import Q

class AutoReconcileService:
    @staticmethod
    def match_statement(statement_id):
        """
        Auto-match lines in the statement against active policies.
        Matching Logic:
        1. Exact Amount Match AND (Policy Number in Description OR Reference)
        2. Exact Amount Match (if unique in potential candidates)
        """
        lines = BankLine.objects.filter(statement_id=statement_id, status=BankLine.STATUS_UNMATCHED)
        matches_count = 0

        for line in lines:
            # Strategy 1: Look for Policy Number in Description
            # Assuming Policy Number format like "POL-"
            # This is a basic heuristics check
            
            # Find policies with the exact premium amount
            candidates = Policy.objects.filter(premium_amount=line.amount, status='ACTIVE')
            
            match_found = None

            if candidates.count() == 1:
                # Strong signal: Unique amount match
                match_found = candidates.first()
            elif candidates.count() > 1:
                # Multiple policies with same amount. Check description for Policy Number
                for policy in candidates:
                    if policy.policy_number in line.description or (line.reference and policy.policy_number in line.reference):
                        match_found = policy
                        break
            
            if match_found:
                line.matched_policy = match_found
                line.status = BankLine.STATUS_MATCHED
                line.save()
                matches_count += 1
        
        return matches_count
