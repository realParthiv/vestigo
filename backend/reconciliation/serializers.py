from rest_framework import serializers
from .models import BankStatement, BankLine, BrokerageStatement, BrokerageLine
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
        fields = ['id', 'name', 'uploaded_at', 'file', 'lines', 'unmatched_count', 'matched_count']

    def get_unmatched_count(self, obj):
        return obj.lines.filter(status='UNMATCHED').count()

    def get_matched_count(self, obj):
        return obj.lines.filter(status='MATCHED').count()


class BrokerageLineSerializer(serializers.ModelSerializer):
    matched_policy_details = PolicySerializer(source='matched_policy', read_only=True)

    class Meta:
        model = BrokerageLine
        fields = '__all__'


class BrokerageStatementSerializer(serializers.ModelSerializer):
    lines = BrokerageLineSerializer(many=True, read_only=True)
    unmatched_count = serializers.SerializerMethodField()
    matched_count = serializers.SerializerMethodField()
    variance_count = serializers.SerializerMethodField()
    approved_count = serializers.SerializerMethodField()

    class Meta:
        model = BrokerageStatement
        fields = [
            'id',
            'name',
            'insurer_name',
            'period_start',
            'period_end',
            'uploaded_at',
            'file',
            'lines',
            'unmatched_count',
            'matched_count',
            'variance_count',
            'approved_count',
        ]

    def get_unmatched_count(self, obj):
        return obj.lines.filter(status=BrokerageLine.STATUS_UNMATCHED).count()

    def get_matched_count(self, obj):
        return obj.lines.filter(status=BrokerageLine.STATUS_MATCHED).count()

    def get_variance_count(self, obj):
        return obj.lines.filter(status=BrokerageLine.STATUS_VARIANCE).count()

    def get_approved_count(self, obj):
        return obj.lines.filter(status=BrokerageLine.STATUS_APPROVED).count()
