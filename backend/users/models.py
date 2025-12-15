from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import TimeStampedModel, SoftDeleteModel

class Role(TimeStampedModel):
    ADMIN = 'ADMIN'
    BDM = 'BDM'
    UNDERWRITER = 'UNDERWRITER'
    OPERATIONS = 'OPERATIONS'
    CLAIMS = 'CLAIMS'
    FINANCE = 'FINANCE'
    VIEWER = 'VIEWER'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (BDM, 'Business Development Manager'),
        (UNDERWRITER, 'Underwriter'),
        (OPERATIONS, 'Operations'),
        (CLAIMS, 'Claims'),
        (FINANCE, 'Finance'),
        (VIEWER, 'Viewer'),
    ]

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    permissions_config = models.JSONField(default=dict, blank=True, help_text="Custom permissions and UI config for this role")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.get_name_display()

class User(AbstractUser, SoftDeleteModel):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Override groups and permissions to avoid clashes with default User if needed, 
    # but since we are using AUTH_USER_MODEL, it should be fine. 
    # However, keeping it clean.
    
    def __str__(self):
        return self.username
