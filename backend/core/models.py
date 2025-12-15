from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created_at' and 'updated_at' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SoftDeleteModel(TimeStampedModel):
    """
    Abstract model for soft-deleting records.
    """
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

class FeatureFlag(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    key = models.CharField(max_length=50, unique=True, help_text="Key used in code to check flag")
    is_enabled = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.key})"

class AdminSetting(TimeStampedModel):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(help_text="Configuration value in JSON format")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.key
