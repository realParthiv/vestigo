from django.db import models
from core.models import TimeStampedModel
from .models import Policy

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
