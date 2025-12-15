from django.contrib import admin
from .models import Lead, Opportunity, Activity

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'company_name', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'source')
    search_fields = ('first_name', 'last_name', 'email', 'company_name')

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'lead', 'stage', 'expected_revenue', 'assigned_to')
    list_filter = ('stage',)
    search_fields = ('name', 'lead__first_name', 'lead__company_name')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('type', 'summary', 'performed_by', 'performed_at')
    list_filter = ('type', 'performed_at')
