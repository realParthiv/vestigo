from rest_framework import serializers
from .models import Policy

class PolicySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.first_name', read_only=True)
    
    class Meta:
        model = Policy
        fields = '__all__'
