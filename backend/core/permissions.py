from rest_framework import permissions
from users.models import Role

class RolePermission(permissions.BasePermission):
    """Allow access to authenticated users whose role is in the view's allowed_roles.

    - Admins (is_staff or Role.ADMIN) are always allowed.
    - If a view does not define allowed_roles, any authenticated user is allowed.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or (getattr(user, "role", None) and user.role.name == Role.ADMIN):
            return True

        allowed = getattr(view, "allowed_roles", None)
        if allowed is None:
            return True

        user_role = getattr(user, "role", None)
        return bool(user_role and user_role.name in allowed)
