from django.contrib import admin
from .models import Claim

@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('claim_number', 'policy', 'claim_amount', 'approved_amount', 'status', 'incident_date', 'created_at')
    list_filter = ('status', 'incident_date', 'created_at')
    search_fields = ('claim_number', 'policy__policy_number', 'policy__customer__email', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Claim Information', {
            'fields': ('claim_number', 'policy', 'status', 'incident_date')
        }),
        ('Claim Details', {
            'fields': ('description', 'claim_amount', 'approved_amount', 'attachments')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
