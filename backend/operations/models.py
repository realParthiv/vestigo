from django.db import models
from core.models import TimeStampedModel, SoftDeleteModel
from django.contrib.auth import get_user_model
from bdm.models import Lead

User = get_user_model()

class Policy(SoftDeleteModel):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    TYPE_HEALTH = 'HEALTH'
    TYPE_AUTO = 'AUTO'
    TYPE_LIFE = 'LIFE'
    TYPE_HOME = 'HOME'
    
    TYPE_CHOICES = [
        (TYPE_HEALTH, 'Health'),
        (TYPE_AUTO, 'Auto'),
        (TYPE_LIFE, 'Life'),
        (TYPE_HOME, 'Home'),
    ]

    policy_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='policies')
    policy_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    premium_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    
    def __str__(self):
        return f"{self.policy_number} - {self.customer}"


class PremiumPayment(TimeStampedModel):
    """Track individual premium payments for policies"""
    
    PAYMENT_STATUS_PENDING = 'PENDING'
    PAYMENT_STATUS_PAID = 'PAID'
    PAYMENT_STATUS_OVERDUE = 'OVERDUE'
    PAYMENT_STATUS_FAILED = 'FAILED'
    
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_PAID, 'Paid'),
        (PAYMENT_STATUS_OVERDUE, 'Overdue'),
        (PAYMENT_STATUS_FAILED, 'Failed'),
    ]
    
    PAYMENT_METHOD_BANK_TRANSFER = 'BANK_TRANSFER'
    PAYMENT_METHOD_CREDIT_CARD = 'CREDIT_CARD'
    PAYMENT_METHOD_DEBIT_CARD = 'DEBIT_CARD'
    PAYMENT_METHOD_CASH = 'CASH'
    PAYMENT_METHOD_CHECK = 'CHECK'
    
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_METHOD_BANK_TRANSFER, 'Bank Transfer'),
        (PAYMENT_METHOD_CREDIT_CARD, 'Credit Card'),
        (PAYMENT_METHOD_DEBIT_CARD, 'Debit Card'),
        (PAYMENT_METHOD_CASH, 'Cash'),
        (PAYMENT_METHOD_CHECK, 'Check'),
    ]
    
    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='payments')
    payment_number = models.CharField(max_length=50, unique=True, help_text="Unique payment reference number")
    
    # Payment dates
    due_date = models.DateField(help_text="When this payment is due")
    paid_date = models.DateField(null=True, blank=True, help_text="When payment was actually made")
    
    # Amounts
    amount_due = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount to be paid")
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Actual amount paid")
    
    # Payment details
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    
    # Additional info
    transaction_id = models.CharField(max_length=100, null=True, blank=True, help_text="Bank/gateway transaction ID")
    notes = models.TextField(blank=True, help_text="Additional notes about this payment")
    
    class Meta:
        ordering = ['-due_date']
        
    def __str__(self):
        return f"{self.payment_number} - {self.policy.policy_number} - ${self.amount_due}"
    
    @property
    def is_overdue(self):
        """Check if payment is overdue"""
        from django.utils import timezone
        if self.status == self.PAYMENT_STATUS_PAID:
            return False
        return self.due_date < timezone.now().date()
    
    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if not self.is_overdue:
            return 0
        from django.utils import timezone
        return (timezone.now().date() - self.due_date).days
    
    def mark_as_paid(self, amount, payment_method, transaction_id=None, paid_date=None):
        """Mark payment as paid"""
        from django.utils import timezone
        self.status = self.PAYMENT_STATUS_PAID
        self.amount_paid = amount
        self.payment_method = payment_method
        self.transaction_id = transaction_id
        self.paid_date = paid_date or timezone.now().date()
        self.save()

class LateChargePolicy(TimeStampedModel):
    """
    Admin-configurable late payment charge policies.
    E.g., 2% per month after due date, or flat $50 after 30 days
    """
    CHARGE_TYPE_PERCENTAGE = 'PERCENTAGE'  # % of due amount
    CHARGE_TYPE_FLAT = 'FLAT'  # Fixed dollar amount
    
    CHARGE_TYPE_CHOICES = [
        (CHARGE_TYPE_PERCENTAGE, 'Percentage of Payment Amount'),
        (CHARGE_TYPE_FLAT, 'Flat Fee'),
    ]
    
    TRIGGER_TYPE_DAYS_OVERDUE = 'DAYS_OVERDUE'  # After X days past due
    TRIGGER_TYPE_MONTHS_OVERDUE = 'MONTHS_OVERDUE'  # After X months past due
    
    TRIGGER_TYPE_CHOICES = [
        (TRIGGER_TYPE_DAYS_OVERDUE, 'Days Overdue'),
        (TRIGGER_TYPE_MONTHS_OVERDUE, 'Months Overdue'),
    ]
    
    # Policy identification
    name = models.CharField(max_length=100, help_text="E.g., 'Standard 2% Monthly Late Charge'")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # When to trigger the charge
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPE_CHOICES, default=TRIGGER_TYPE_DAYS_OVERDUE)
    trigger_threshold = models.IntegerField(help_text="Days or months threshold before charge applies")
    
    # How much to charge
    charge_type = models.CharField(max_length=20, choices=CHARGE_TYPE_CHOICES)
    charge_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Percentage (e.g., 2.5 for 2.5%) or flat amount (e.g., 50.00)"
    )
    
    # Caps/limits
    maximum_charge_per_payment = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Cap on total late charge per payment (optional)"
    )
    
    # Applied to which policies
    applies_to_all_policies = models.BooleanField(
        default=True,
        help_text="If False, manually select which policies use this"
    )
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_late_policies')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Late Charge Policies"
    
    def __str__(self):
        return f"{self.name} ({self.charge_amount} {self.charge_type})"
    
    def calculate_charge(self, payment, days_overdue):
        """Calculate late charge for a given payment and days overdue."""
        from decimal import Decimal
        
        # Check if threshold is met
        if self.trigger_type == self.TRIGGER_TYPE_DAYS_OVERDUE:
            if days_overdue < self.trigger_threshold:
                return Decimal('0.00')
        elif self.trigger_type == self.TRIGGER_TYPE_MONTHS_OVERDUE:
            months_overdue = days_overdue // 30
            if months_overdue < self.trigger_threshold:
                return Decimal('0.00')
        
        # Calculate charge amount
        if self.charge_type == self.CHARGE_TYPE_PERCENTAGE:
            charge = (float(payment.amount_due) * float(self.charge_amount)) / 100
        else:  # FLAT
            charge = float(self.charge_amount)
        
        # Apply cap if set
        if self.maximum_charge_per_payment:
            charge = min(charge, float(self.maximum_charge_per_payment))
        
        return Decimal(str(charge)).quantize(Decimal('0.01'))


class LateCharge(TimeStampedModel):
    """Track late charges applied to specific payments."""
    
    payment = models.OneToOneField(
        PremiumPayment,
        on_delete=models.CASCADE,
        related_name='late_charge',
        help_text="Payment this charge is applied to"
    )
    
    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='late_charges')
    
    # Charge details
    charge_policy = models.ForeignKey(
        LateChargePolicy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Which policy generated this charge (can be null if manually created)"
    )
    
    # Amounts
    charge_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Late charge amount")
    reason = models.CharField(
        max_length=200,
        default="Late Payment Charge",
        help_text="Why this charge was applied"
    )
    
    # Payment status
    is_paid = models.BooleanField(default=False, help_text="Has the late charge been paid?")
    paid_date = models.DateField(null=True, blank=True)
    
    # Admin notes
    admin_notes = models.TextField(blank=True, help_text="Admin can add notes about this charge")
    waived = models.BooleanField(default=False, help_text="Admin can waive the charge")
    waived_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='waived_late_charges')
    waived_reason = models.TextField(blank=True)
    waived_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['payment', 'policy']
    
    def __str__(self):
        return f"Late Charge ${self.charge_amount} for {self.payment.payment_number}"