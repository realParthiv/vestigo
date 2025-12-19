from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source='created_at', format="%b %d, %H:%M", read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'link', 'timestamp', 'created_at']
