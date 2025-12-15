from django.db import models
from core.models import TimeStampedModel, SoftDeleteModel
from bdm.models import Opportunity
from django.conf import settings

class Submission(SoftDeleteModel):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_MORE_INFO = 'MORE_INFO_REQUIRED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_MORE_INFO, 'More Information Required'),
    ]

    opportunity = models.OneToOneField(Opportunity, on_delete=models.CASCADE, related_name='submission')
    underwriter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='underwritten_submissions')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_PENDING)
    risk_score = models.IntegerField(help_text="Risk score from 1-100", null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Snapshot of key data at time of submission
    submitted_premium = models.DecimalField(max_digits=12, decimal_places=2, null=True)

    def __str__(self):
        return f"SUB-{self.id} ({self.opportunity.name})"
