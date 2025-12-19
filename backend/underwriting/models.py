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
    
    def calculate_risk_score(self):
        """Calculate risk score based on opportunity data"""
        score = 25  # Base score
        
        # Factor in probability (inverse relationship)
        if self.opportunity.probability:
            score += (100 - self.opportunity.probability) // 2
        
        # Factor in premium amount (higher premium = higher risk)
        if self.opportunity.expected_revenue:
            if self.opportunity.expected_revenue > 100000:
                score += 30
            elif self.opportunity.expected_revenue > 50000:
                score += 20
            elif self.opportunity.expected_revenue > 10000:
                score += 10
        
        return min(score, 100)  # Cap at 100
    
    def save(self, *args, **kwargs):
        # Auto-calculate risk score if not set
        if self.risk_score is None:
            self.risk_score = self.calculate_risk_score()
        
        # Snapshot submitted premium
        if not self.submitted_premium and self.opportunity:
            self.submitted_premium = self.opportunity.expected_revenue
        
        super().save(*args, **kwargs)
