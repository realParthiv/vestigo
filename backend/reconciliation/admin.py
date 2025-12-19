from django.contrib import admin
from .models import BankStatement, BankLine

@admin.register(BankStatement)
class BankStatementAdmin(admin.ModelAdmin):
    list_display = ('name', 'uploaded_at', 'get_matched_count', 'get_unmatched_count')
    search_fields = ('name',)
    readonly_fields = ('uploaded_at',)
    
    def get_matched_count(self, obj):
        return obj.lines.filter(status='MATCHED').count()
    get_matched_count.short_description = 'Matched'
    
    def get_unmatched_count(self, obj):
        return obj.lines.filter(status='UNMATCHED').count()
    get_unmatched_count.short_description = 'Unmatched'

@admin.register(BankLine)
class BankLineAdmin(admin.ModelAdmin):
    list_display = ('statement', 'date', 'description', 'amount', 'status', 'matched_policy')
    list_filter = ('status', 'date')
    search_fields = ('description', 'reference', 'matched_policy__policy_number')
    readonly_fields = ('created_at',)
