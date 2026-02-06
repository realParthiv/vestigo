from django.db import models
from core.models import TimeStampedModel
from operations.models import Policy

class BankStatement(TimeStampedModel):
    name = models.CharField(max_length=255, help_text="e.g. Jan 2025 Statement")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='statements/', null=True, blank=True, help_text="Original statement file")

    def __str__(self):
        return self.name

class BankLine(TimeStampedModel):
    STATUS_UNMATCHED = 'UNMATCHED'
    STATUS_MATCHED = 'MATCHED'
    STATUS_IGNORED = 'IGNORED'

    STATUS_CHOICES = [
        (STATUS_UNMATCHED, 'Unmatched'),
        (STATUS_MATCHED, 'Matched'),
        (STATUS_IGNORED, 'Ignored'),
    ]

    statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='lines')
    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True, null=True, help_text="Transaction Ref / Chq No")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNMATCHED)
    matched_policy = models.ForeignKey(Policy, on_delete=models.SET_NULL, null=True, blank=True, related_name='reconciled_lines')

    def __str__(self):
        return f"{self.date} - {self.amount} ({self.status})"


class BrokerageStatement(TimeStampedModel):
    name = models.CharField(max_length=255, help_text="e.g. Insurer ABC - Jan 2025 Brokerage")
    insurer_name = models.CharField(max_length=255, blank=True, null=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='brokerage_statements/', null=True, blank=True, help_text="Original statement file")

    def __str__(self):
        return self.name


class BrokerageLine(TimeStampedModel):
    STATUS_UNMATCHED = 'UNMATCHED'
    STATUS_MATCHED = 'MATCHED'
    STATUS_VARIANCE = 'VARIANCE'
    STATUS_APPROVED = 'APPROVED'
    STATUS_IGNORED = 'IGNORED'

    STATUS_CHOICES = [
        (STATUS_UNMATCHED, 'Unmatched'),
        (STATUS_MATCHED, 'Matched'),
        (STATUS_VARIANCE, 'Variance'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_IGNORED, 'Ignored'),
    ]

    statement = models.ForeignKey(BrokerageStatement, on_delete=models.CASCADE, related_name='lines')
    date = models.DateField(null=True, blank=True)
    policy_number = models.CharField(max_length=100, blank=True, null=True)
    premium_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    brokerage_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Brokerage %")
    brokerage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_brokerage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reference = models.CharField(max_length=100, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNMATCHED)
    matched_policy = models.ForeignKey(Policy, on_delete=models.SET_NULL, null=True, blank=True, related_name='brokerage_lines')

    notes = models.TextField(blank=True)
    approval_note = models.TextField(blank=True)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_brokerage_lines')
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.policy_number or 'N/A'} - {self.brokerage_amount} ({self.status})"
