from rest_framework import serializers
from .models import Policy, PremiumPayment, LateChargePolicy, LateCharge

class PolicySerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Policy
        fields = '__all__'
    
    def get_customer_name(self, obj):
        """Return full customer name for search/display"""
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}".strip()
        return "N/A"


class LateChargeSerializer(serializers.ModelSerializer):
    payment_number = serializers.CharField(source='payment.payment_number', read_only=True)
    waived_by_name = serializers.CharField(source='waived_by.get_full_name', read_only=True)
    
    # Customer details
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='policy.customer.email', read_only=True)
    customer_phone = serializers.CharField(source='policy.customer.phone', read_only=True)
    
    # Policy details
    policy_number = serializers.CharField(source='policy.policy_number', read_only=True)
    policy_premium = serializers.DecimalField(source='policy.premium_amount', max_digits=10, decimal_places=2, read_only=True)
    policy_status = serializers.CharField(source='policy.status', read_only=True)
    
    # Payment details
    payment_due_amount = serializers.DecimalField(source='payment.amount_due', max_digits=10, decimal_places=2, read_only=True)
    payment_due_date = serializers.DateField(source='payment.due_date', read_only=True)
    payment_status = serializers.CharField(source='payment.status', read_only=True)
    
    # Policy applied name
    policy_applied = serializers.CharField(source='charge_policy.name', read_only=True)
    
    class Meta:
        model = LateCharge
        fields = '__all__'
    
    def get_customer_name(self, obj):
        """Return full customer name"""
        if obj.policy and obj.policy.customer:
            return f"{obj.policy.customer.first_name} {obj.policy.customer.last_name}".strip()
        return "N/A"


class PremiumPaymentSerializer(serializers.ModelSerializer):
    policy_number = serializers.CharField(source='policy.policy_number', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    late_charge = LateChargeSerializer(read_only=True)

    class Meta:
        model = PremiumPayment
        fields = '__all__'
        read_only_fields = ('status', 'paid_date', 'amount_paid', 'is_overdue', 'days_overdue')

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_days_overdue(self, obj):
        return obj.days_overdue


class LateChargePolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = LateChargePolicy
        fields = '__all__'
