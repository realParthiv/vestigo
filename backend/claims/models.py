from django.db import models
from core.models import TimeStampedModel, SoftDeleteModel
from operations.models import Policy

class Claim(SoftDeleteModel):
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_IN_REVIEW = 'IN_REVIEW'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_PAID = 'PAID'
    
    STATUS_CHOICES = [
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_IN_REVIEW, 'In Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_PAID, 'Paid'),
    ]

    claim_number = models.CharField(max_length=50, unique=True)
    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='claims')
    incident_date = models.DateField()
    description = models.TextField()
    claim_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Amount paid out")
    payout_date = models.DateField(null=True, blank=True, help_text="When payout was completed")
    status_note = models.TextField(blank=True, help_text="Reason or note for the latest status change")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)
    attachments = models.FileField(upload_to='claim_attachments/', null=True, blank=True, help_text="Supporting documents")
    
    def __str__(self):
        return f"{self.claim_number} - {self.policy.policy_number}"
