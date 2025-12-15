from django.db import models
from core.models import TimeStampedModel
from django.conf import settings

class Notification(TimeStampedModel):
    TYPE_INFO = 'INFO'
    TYPE_WARNING = 'WARNING'
    TYPE_SUCCESS = 'SUCCESS'
    
    TYPE_CHOICES = [
        (TYPE_INFO, 'Info'),
        (TYPE_WARNING, 'Warning'),
        (TYPE_SUCCESS, 'Success'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_INFO)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True, help_text="Link to the relevant resource")

    def __str__(self):
        return f"{self.title} - {self.user.username}"
