from rest_framework import serializers
from .models import Claim


class ClaimSerializer(serializers.ModelSerializer):
    policy_number = serializers.CharField(source='policy.policy_number', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='policy.customer.email', read_only=True)
    customer_phone = serializers.CharField(source='policy.customer.phone', read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id', 'claim_number', 'policy', 'policy_number', 'customer_name', 'customer_email', 'customer_phone',
            'incident_date', 'description', 'claim_amount', 'approved_amount', 'paid_amount', 'payout_date',
            'status_note', 'status', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_customer_name(self, obj):
        customer = getattr(obj.policy, 'customer', None)
        if not customer:
            return None
        return f"{customer.first_name} {customer.last_name}".strip()
