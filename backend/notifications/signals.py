from django.db.models.signals import post_save
from django.dispatch import receiver
from operations.models import Policy
from claims.models import Claim
from underwriting.models import Submission
from .models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Submission)
def notify_underwriting_submission(sender, instance, created, **kwargs):
    if created and instance.status == 'PENDING':
        # Notify users with 'UNDERWRITER' role
        try:
            user = User.objects.get(username='bdm')
            Notification.objects.create(
                user=user,
                title="New Underwriting Request",
                message=f"Opportunity {instance.opportunity.name} submitted for review.",
                type=Notification.TYPE_INFO,
                link=f"/underwriting/{instance.id}"
            )
        except User.DoesNotExist:
            pass
    elif instance.status == 'APPROVED':
        # Notify the BDM user
        try:
            user = User.objects.get(username='bdm')
            Notification.objects.create(
                user=user,
                title="Submission Approved",
                message=f"Submission for {instance.opportunity.name} has been approved!",
                type=Notification.TYPE_SUCCESS,
                link=f"/underwriting/{instance.id}"
            )
        except User.DoesNotExist:
            pass

@receiver(post_save, sender=Claim)
def notify_new_claim(sender, instance, created, **kwargs):
    if created:
        try:
            user = User.objects.get(username='bdm')
            Notification.objects.create(
                user=user,
                title="New Claim Filed",
                message=f"Claim filed for Policy {instance.policy.policy_number}. Amount: ${instance.claim_amount}",
                type=Notification.TYPE_WARNING,
                link="/claims" 
            )
        except User.DoesNotExist:
            pass
