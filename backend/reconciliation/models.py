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
