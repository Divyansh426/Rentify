from rest_framework.permissions import BasePermission

class IsLandlord(BasePermission):
    """Only allow users with role='landlord'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'landlord')

class IsLandlordOrReadOnlyOwn(BasePermission):
    """Tenant can only see their own data."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'landlord':
            # Landlord can only see their own tenants
            return obj.landlord == request.user
        # Tenant can only see their own profile
        return obj.tenant == request.user