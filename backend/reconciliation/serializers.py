from rest_framework import serializers
from .models import BankStatement, BankLine
from operations.serializers import PolicySerializer

class BankLineSerializer(serializers.ModelSerializer):
    matched_policy_details = PolicySerializer(source='matched_policy', read_only=True)

    class Meta:
        model = BankLine
        fields = '__all__'

class BankStatementSerializer(serializers.ModelSerializer):
    lines = BankLineSerializer(many=True, read_only=True)
    unmatched_count = serializers.SerializerMethodField()
    matched_count = serializers.SerializerMethodField()

    class Meta:
        model = BankStatement
        fields = ['id', 'name', 'uploaded_at', 'lines', 'unmatched_count', 'matched_count']

    def get_unmatched_count(self, obj):
        return obj.lines.filter(status='UNMATCHED').count()

    def get_matched_count(self, obj):
        return obj.lines.filter(status='MATCHED').count()
