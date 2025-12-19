from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import OperationalError
from .models import Notification
from .serializers import NotificationSerializer
from core.permissions import RolePermission

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    allowed_roles = None  # Any authenticated user can access their notifications

    def get_queryset(self):
        """Admins see all notifications; others see their own."""
        qs = Notification.objects.all().order_by('-created_at')
        user = self.request.user
        try:
            user_role = getattr(getattr(user, 'role', None), 'name', None)
        except Exception:
            user_role = None

        if user and (user.is_staff or user_role == Role.ADMIN):
            return qs
        return qs.filter(user=user)

    def list(self, request, *args, **kwargs):
        """Return notifications for the current user; fall back gracefully if table is absent."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except OperationalError:
            return Response([], status=status.HTTP_200_OK)
        except Exception as exc:
            # Defensive: never 500 the dashboard on notifications fetch
            return Response({'error': str(exc)}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked read'})
