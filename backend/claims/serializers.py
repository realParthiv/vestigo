from rest_framework import serializers
from .models import Claim

class ClaimSerializer(serializers.ModelSerializer):
    policy_number = serializers.CharField(source='policy.policy_number', read_only=True)
    customer_name = serializers.CharField(source='policy.customer.first_name', read_only=True)

    class Meta:
        model = Claim
        fields = '__all__'
