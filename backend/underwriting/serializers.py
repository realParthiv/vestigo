from rest_framework import serializers
from .models import Submission
from bdm.serializers import OpportunitySerializer

class SubmissionSerializer(serializers.ModelSerializer):
    opportunity_details = OpportunitySerializer(source='opportunity', read_only=True)
    underwriter_name = serializers.CharField(source='underwriter.get_full_name', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['status', 'underwriter', 'submitted_premium']
