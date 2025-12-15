from rest_framework import serializers
from .models import Lead, Opportunity, Activity

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')

class ActivitySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class OpportunitySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.first_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
