from django.db.models.signals import post_save
from django.dispatch import receiver
from operations.models import Policy, PremiumPayment
from claims.models import Claim
from underwriting.models import Submission
from .models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

def get_role_users(role_name):
    """Get users with specific role"""
    from users.models import Role
    role = Role.objects.filter(name=role_name).first()
    if role:
        return User.objects.filter(role=role, is_active=True)
    return User.objects.none()

@receiver(post_save, sender=Submission)
def notify_underwriting_submission(sender, instance, created, **kwargs):
    if created and instance.status == 'PENDING':
        # Notify underwriters
        for user in get_role_users('UNDERWRITER'):
            Notification.objects.create(
                user=user,
                title="New Underwriting Request",
                message=f"Opportunity {instance.opportunity.name} submitted for review.",
                type=Notification.TYPE_INFO,
                link=f"/underwriting/{instance.id}"
            )
    elif instance.status == 'APPROVED':
        # Notify BDMs
        for user in get_role_users('BDM'):
            Notification.objects.create(
                user=user,
                title="Submission Approved",
                message=f"Submission for {instance.opportunity.name} has been approved!",
                type=Notification.TYPE_SUCCESS,
                link=f"/underwriting/{instance.id}"
            )
    elif instance.status == 'REJECTED':
        for user in get_role_users('BDM'):
            Notification.objects.create(
                user=user,
                title="Submission Rejected",
                message=f"Submission for {instance.opportunity.name} has been rejected.",
                type=Notification.TYPE_WARNING,
                link=f"/underwriting/{instance.id}"
            )

@receiver(post_save, sender=Policy)
def notify_policy_issued(sender, instance, created, **kwargs):
    if created:
        for user in get_role_users('OPERATIONS'):
            Notification.objects.create(
                user=user,
                title="New Policy Issued",
                message=f"Policy {instance.policy_number} issued for {instance.customer.first_name} {instance.customer.last_name}",
                type=Notification.TYPE_SUCCESS,
                link=f"/policies/{instance.id}"
            )

@receiver(post_save, sender=Claim)
def notify_claim_status(sender, instance, created, **kwargs):
    if created:
        for user in get_role_users('CLAIMS'):
            Notification.objects.create(
                user=user,
                title="New Claim Filed",
                message=f"Claim filed for Policy {instance.policy.policy_number}. Amount: ${instance.claim_amount}",
                type=Notification.TYPE_WARNING,
                link="/claims"
            )
    elif instance.status == 'APPROVED':
        for user in get_role_users('OPERATIONS'):
            Notification.objects.create(
                user=user,
                title="Claim Approved",
                message=f"Claim {instance.claim_number} approved. Payout: ${instance.approved_amount}",
                type=Notification.TYPE_SUCCESS,
                link="/claims"
            )

@receiver(post_save, sender=PremiumPayment)
def notify_payment_status(sender, instance, created, **kwargs):
    if instance.status == 'PAID' and instance.paid_date:
        for user in get_role_users('FINANCE'):
            Notification.objects.create(
                user=user,
                title="Payment Received",
                message=f"Payment {instance.payment_number} marked paid: ${instance.amount_paid}",
                type=Notification.TYPE_SUCCESS,
                link=f"/policies/{instance.policy.id}"
            )
    elif instance.status == 'OVERDUE' and not created:
        for user in get_role_users('OPERATIONS'):
            Notification.objects.create(
                user=user,
                title="Payment Overdue",
                message=f"Payment {instance.payment_number} is {instance.days_overdue} days overdue",
                type=Notification.TYPE_WARNING,
                link=f"/policies/{instance.policy.id}"
            )
