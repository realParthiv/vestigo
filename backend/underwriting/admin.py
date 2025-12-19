from django.contrib import admin
from .models import Submission

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('opportunity', 'status', 'underwriter', 'risk_score', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('opportunity__name', 'opportunity__lead__first_name', 'opportunity__lead__company_name', 'underwriter__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Submission Information', {
            'fields': ('opportunity', 'status', 'underwriter')
        }),
        ('Underwriting Details', {
            'fields': ('risk_score', 'submitted_premium', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
