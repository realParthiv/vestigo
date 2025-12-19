from rest_framework import serializers
from .models import Submission
from bdm.serializers import OpportunitySerializer

class SubmissionSerializer(serializers.ModelSerializer):
    opportunity_details = OpportunitySerializer(source='opportunity', read_only=True)
    underwriter_name = serializers.CharField(source='underwriter.get_full_name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    created_date = serializers.DateTimeField(source='created_at', read_only=True)
    risk_recommendation = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['status', 'underwriter', 'submitted_premium', 'risk_score']
    
    def get_customer_name(self, obj):
        """Get customer name from linked opportunity's lead"""
        if obj.opportunity and obj.opportunity.lead:
            return f"{obj.opportunity.lead.first_name} {obj.opportunity.lead.last_name}"
        return "N/A"
    
    def get_risk_recommendation(self, obj):
        """Provide recommendation based on risk score"""
        if not obj.risk_score:
            return "Pending Review"
        
        if obj.risk_score < 30:
            return "Low Risk - Recommend Approval"
        elif obj.risk_score < 60:
            return "Medium Risk - Review Required"
        else:
            return "High Risk - Caution Advised"
