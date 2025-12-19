from django.contrib import admin
from .models import Policy, PremiumPayment, LateChargePolicy, LateCharge

@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ('policy_number', 'customer', 'policy_type', 'status', 'start_date', 'premium_amount', 'created_at')
    list_filter = ('status', 'policy_type', 'created_at')
    search_fields = ('policy_number', 'customer__first_name', 'customer__last_name', 'customer__email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Policy Information', {
            'fields': ('policy_number', 'customer', 'policy_type', 'status')
        }),
        ('Coverage', {
            'fields': ('premium_amount', 'start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PremiumPayment)
class PremiumPaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_number', 'policy', 'amount_due', 'due_date', 'status', 'paid_date', 'is_overdue')
    list_filter = ('status', 'due_date', 'paid_date')
    search_fields = ('payment_number', 'policy__policy_number', 'policy__customer__email')
    readonly_fields = ('created_at', 'updated_at', 'is_overdue', 'days_overdue')
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_number', 'policy', 'amount_due', 'due_date', 'status')
        }),
        ('Payment Details', {
            'fields': ('amount_paid', 'paid_date', 'payment_method', 'transaction_id', 'notes')
        }),
        ('Status', {
            'fields': ('is_overdue', 'days_overdue'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(LateChargePolicy)
class LateChargePolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'charge_type', 'charge_amount', 'trigger_type', 'trigger_threshold', 'is_active', 'created_by')
    list_filter = ('charge_type', 'trigger_type', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'created_by__email')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    fieldsets = (
        ('Policy Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Charge Configuration', {
            'fields': ('charge_type', 'charge_amount', 'maximum_charge_cap')
        }),
        ('Trigger Configuration', {
            'fields': ('trigger_type', 'trigger_value')
        }),
        ('Admin Info', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(LateCharge)
class LateChargeAdmin(admin.ModelAdmin):
    list_display = ('payment', 'charge_amount', 'waived', 'is_paid', 'charge_policy', 'created_at')
    list_filter = ('waived', 'is_paid', 'created_at', 'charge_policy')
    search_fields = ('payment__payment_number', 'payment__policy__policy_number', 'reason')
    readonly_fields = ('created_at', 'updated_at', 'paid_date', 'waived_date')
    fieldsets = (
        ('Charge Information', {
            'fields': ('payment', 'charge_policy', 'charge_amount', 'reason')
        }),
        ('Status', {
            'fields': ('waived', 'is_paid')
        }),
        ('Waiver Information', {
            'fields': ('waived_by', 'waived_reason', 'waived_date'),
            'classes': ('collapse',)
        }),
        ('Payment Information', {
            'fields': ('paid_date',),
            'classes': ('collapse',)
        }),
        ('Admin Notes', {
            'fields': ('admin_notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

