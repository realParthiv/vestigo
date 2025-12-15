"""
Seed premium payment data for testing
Creates payment records for existing policies with varying statuses
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vestigo_backend.settings')
django.setup()

from operations.models import Policy, PremiumPayment
from django.utils import timezone

def seed_premium_payments():
    print("Starting premium payment seeding...")
    
    # Get all policies
    policies = Policy.objects.all()[:20]  # Use first 20 policies
    
    if not policies:
        print("ERROR: No policies found! Run seed_reports_data.py first.")
        return
    
    payment_methods = ['BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHECK']
    
    payment_count = 0
    
    for policy in policies:
        # Calculate monthly premium (assuming annual payment divided by 12)
        monthly_premium = policy.premium_amount / 12
        
        # Create payment schedule for the policy duration
        start_date = policy.start_date
        end_date = policy.end_date
        
        # Generate monthly payments
        current_date = start_date
        payment_num = 1
        
        while current_date < end_date:
            # Determine payment due date (1st of each month)
            due_date = current_date + timedelta(days=30 * payment_num)
            
            if due_date > end_date:
                break
            
            # Determine status based on due date
            today = timezone.now().date()
            
            if due_date < today - timedelta(days=30):
                # Old payments - most should be paid
                if payment_num % 5 != 0:  # 80% paid
                    status = 'PAID'
                    paid_date = due_date + timedelta(days=(payment_num % 10))  # Paid within 10 days
                    amount_paid = monthly_premium
                    payment_method = payment_methods[payment_num % len(payment_methods)]
                    transaction_id = f"TXN-{timezone.now().timestamp():.0f}-{payment_num}"
                else:
                    status = 'OVERDUE'
                    paid_date = None
                    amount_paid = None
                    payment_method = None
                    transaction_id = None
            elif due_date < today:
                # Recent past - mixed statuses
                if payment_num % 3 == 0:
                    status = 'OVERDUE'
                    paid_date = None
                    amount_paid = None
                    payment_method = None
                    transaction_id = None
                else:
                    status = 'PAID'
                    paid_date = due_date + timedelta(days=2)
                    amount_paid = monthly_premium
                    payment_method = payment_methods[payment_num % len(payment_methods)]
                    transaction_id = f"TXN-{timezone.now().timestamp():.0f}-{payment_num}"
            else:
                # Future payments - pending
                status = 'PENDING'
                paid_date = None
                amount_paid = None
                payment_method = None
                transaction_id = None
            
            # Create payment record
            payment_number = f"PAY-{policy.policy_number}-{payment_num:03d}"
            
            PremiumPayment.objects.update_or_create(
                payment_number=payment_number,
                defaults={
                    'policy': policy,
                    'due_date': due_date,
                    'paid_date': paid_date,
                    'amount_due': monthly_premium,
                    'amount_paid': amount_paid,
                    'status': status,
                    'payment_method': payment_method,
                    'transaction_id': transaction_id,
                    'notes': f"Monthly premium payment #{payment_num}"
                }
            )
            
            payment_count += 1
            payment_num += 1
    
    print("\n" + "="*50)
    print("PAYMENT SEEDING SUMMARY")
    print("="*50)
    print(f"Total Payments Created: {payment_count}")
    print(f"  - Paid: {PremiumPayment.objects.filter(status='PAID').count()}")
    print(f"  - Pending: {PremiumPayment.objects.filter(status='PENDING').count()}")
    print(f"  - Overdue: {PremiumPayment.objects.filter(status='OVERDUE').count()}")
    print("="*50)
    print("Payment seeding completed!")
    print("You can now see real payment history on policy details pages!")
    print("="*50)

if __name__ == '__main__':
    seed_premium_payments()
