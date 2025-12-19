from django.db import models
from core.models import SoftDeleteModel, TimeStampedModel
from users.models import User

class Lead(SoftDeleteModel):
    STATUS_NEW = 'NEW'
    STATUS_CONTACTED = 'CONTACTED'
    STATUS_QUALIFIED = 'QUALIFIED'
    STATUS_LOST = 'LOST'
    STATUS_CONVERTED = 'CONVERTED'

    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_CONTACTED, 'Contacted'),
        (STATUS_QUALIFIED, 'Qualified'),
        (STATUS_LOST, 'Lost'),
        (STATUS_CONVERTED, 'Converted'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    company_name = models.CharField(max_length=150, blank=True, null=True)
    source = models.CharField(max_length=100, help_text="Referral, Website, etc.")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.company_name or ''}"

class Opportunity(SoftDeleteModel):
    STAGE_DISCOVERY = 'DISCOVERY'
    STAGE_QUOTE = 'QUOTE'
    STAGE_NEGOTIATION = 'NEGOTIATION'
    STAGE_CLOSED_WON = 'CLOSED_WON'
    STAGE_CLOSED_LOST = 'CLOSED_LOST'

    STAGE_CHOICES = [
        (STAGE_DISCOVERY, 'Discovery'),
        (STAGE_QUOTE, 'Quote Sent'),
        (STAGE_NEGOTIATION, 'Negotiation'),
        (STAGE_CLOSED_WON, 'Closed Won'),
        (STAGE_CLOSED_LOST, 'Closed Lost'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='opportunities')
    name = models.CharField(max_length=200, help_text="Opportunity Name (e.g. 'Cyber Insurance 2025')")
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default=STAGE_DISCOVERY)
    expected_revenue = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_close_date = models.DateField(null=True, blank=True)
    probability = models.IntegerField(default=25, help_text="Win probability percentage (0-100)")
    notes = models.TextField(blank=True, help_text="Additional notes about the opportunity")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')

    def __str__(self):
        return self.name

class Activity(TimeStampedModel):
    TYPE_CALL = 'CALL'
    TYPE_MEETING = 'MEETING'
    TYPE_EMAIL = 'EMAIL'
    TYPE_NOTE = 'NOTE'

    TYPE_CHOICES = [
        (TYPE_CALL, 'Call'),
        (TYPE_MEETING, 'Meeting'),
        (TYPE_EMAIL, 'Email'),
        (TYPE_NOTE, 'Note'),
    ]

    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    summary = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activities')
    performed_at = models.DateTimeField()

    def __str__(self):
        return f"{self.type}: {self.summary}"
