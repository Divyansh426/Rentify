from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date
from .models import TenantProfile, RentPayment, Room, Property, Notification
from .serializers import (
    RegisterSerializer, UserSerializer, TenantDetailSerializer,
    RentPaymentSerializer, RoomSerializer, NotificationSerializer,
    PropertySerializer
)
from .permissions import IsLandlord, IsLandlordOrReadOnlyOwn

User = get_user_model()


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Tenants ───────────────────────────────────────────────────────────────────

class TenantListView(generics.ListAPIView):
    serializer_class = TenantDetailSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        return TenantProfile.objects.filter(
            landlord=self.request.user
        ).select_related('tenant', 'room').prefetch_related('payments')


class TenantSelfView(generics.RetrieveAPIView):
    serializer_class = TenantDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return TenantProfile.objects.select_related(
                'tenant', 'room'
            ).prefetch_related('payments').get(tenant=self.request.user)
        except TenantProfile.DoesNotExist:
            raise NotFound("No profile found. Please contact your landlord.")


class TenantDetailView(generics.RetrieveAPIView):
    serializer_class = TenantDetailSerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnlyOwn]

    def get_queryset(self):
        if self.request.user.role == 'landlord':
            return TenantProfile.objects.filter(landlord=self.request.user)
        return TenantProfile.objects.filter(tenant=self.request.user)


class SearchTenantView(APIView):
    permission_classes = [IsLandlord]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({'error': 'Provide a username to search.'}, status=400)
        try:
            user = User.objects.get(username=username, role='tenant')
        except User.DoesNotExist:
            return Response({'error': 'No tenant account found with that username.'}, status=404)
        if hasattr(user, 'tenant_profile'):
            profile = user.tenant_profile
            if profile.landlord and profile.landlord != request.user:
                return Response({'error': 'This tenant is already linked to another landlord.'}, status=400)
        return Response(UserSerializer(user).data)


class AssignTenantView(APIView):
    permission_classes = [IsLandlord]

    def post(self, request):
        username = request.data.get('username', '').strip()
        room_id = request.data.get('room_id')
        move_in_date = request.data.get('move_in_date')

        if not username:
            return Response({'error': 'Username is required.'}, status=400)
        if not room_id:
            return Response({'error': 'Room is required.'}, status=400)

        try:
            tenant_user = User.objects.get(username=username, role='tenant')
        except User.DoesNotExist:
            return Response({'error': 'No tenant found with that username.'}, status=404)

        try:
            room = Room.objects.get(id=room_id, property__landlord=request.user, is_occupied=False)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found or already occupied.'}, status=404)

        profile, created = TenantProfile.objects.get_or_create(tenant=tenant_user)
        if not created and profile.landlord and profile.landlord != request.user:
            return Response({'error': 'Tenant is already assigned to another landlord.'}, status=400)

        profile.landlord = request.user
        profile.room = room
        if move_in_date:
            profile.move_in_date = move_in_date
        profile.save()

        room.is_occupied = True
        room.save()

        # Auto-create this month's rent payment
        today = date.today()
        RentPayment.objects.get_or_create(
            tenant_profile=profile,
            month=today.replace(day=1),
            defaults={'amount': room.rent_amount, 'status': 'unpaid'}
        )

        return Response(
            TenantDetailSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class RemoveTenantView(APIView):
    permission_classes = [IsLandlord]

    def delete(self, request, pk):
        try:
            profile = TenantProfile.objects.get(id=pk, landlord=request.user)
        except TenantProfile.DoesNotExist:
            return Response({'error': 'Tenant not found.'}, status=404)

        if profile.room:
            profile.room.is_occupied = False
            profile.room.save()

        profile.landlord = None
        profile.room = None
        profile.save()
        return Response({'message': 'Tenant removed successfully.'}, status=200)


# ── Rent ──────────────────────────────────────────────────────────────────────

class UpdateRentStatusView(generics.UpdateAPIView):
    serializer_class = RentPaymentSerializer
    permission_classes = [IsLandlord]
    http_method_names = ['patch']

    def get_queryset(self):
        return RentPayment.objects.filter(tenant_profile__landlord=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')

        # Auto-set paid_on date
        if new_status == 'paid' and not instance.paid_on:
            request.data['paid_on'] = date.today().isoformat()
        elif new_status == 'unpaid':
            request.data['paid_on'] = None

        return super().partial_update(request, *args, **kwargs)


class CreateRentPaymentView(generics.CreateAPIView):
    """Landlord manually creates a rent payment record for a tenant."""
    serializer_class = RentPaymentSerializer
    permission_classes = [IsLandlord]

    def perform_create(self, serializer):
        tenant_profile_id = self.request.data.get('tenant_profile_id')
        try:
            profile = TenantProfile.objects.get(id=tenant_profile_id, landlord=self.request.user)
        except TenantProfile.DoesNotExist:
            raise NotFound('Tenant profile not found.')
        serializer.save(tenant_profile=profile)


# ── Rooms ─────────────────────────────────────────────────────────────────────

class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        show_all = self.request.query_params.get('all', False)
        qs = Room.objects.filter(property__landlord=self.request.user).select_related('property')
        if not show_all:
            qs = qs.filter(is_occupied=False)
        return qs


# ── Properties ────────────────────────────────────────────────────────────────

class PropertyListCreateView(generics.ListCreateAPIView):
    """Landlord can list and create their properties FROM the app (no admin needed)."""
    serializer_class = PropertySerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        return Property.objects.filter(
            landlord=self.request.user
        ).prefetch_related('rooms')

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        return Property.objects.filter(landlord=self.request.user)


class RoomCreateView(generics.CreateAPIView):
    """Landlord adds a room to their property."""
    serializer_class = RoomSerializer
    permission_classes = [IsLandlord]

    def perform_create(self, serializer):
        property_id = self.kwargs.get('property_id')
        try:
            prop = Property.objects.get(id=property_id, landlord=self.request.user)
        except Property.DoesNotExist:
            raise NotFound('Property not found.')
        serializer.save(property=prop)


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """Returns current user's notifications, newest first."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkNotificationReadView(APIView):
    """Mark a single notification as read."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({'status': 'marked read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read in one click."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked read'})


# ── Analytics ─────────────────────────────────────────────────────────────────

class LandlordAnalyticsView(APIView):
    """
    Dashboard analytics for the landlord.
    Returns monthly revenue for last 6 months, occupancy rate, and payment stats.
    Shows interviewers you know Django ORM aggregations.
    """
    permission_classes = [IsLandlord]

    def get(self, request):
        landlord = request.user
        today = timezone.now().date()

        # All tenant profiles under this landlord
        profiles = TenantProfile.objects.filter(landlord=landlord)
        all_payments = RentPayment.objects.filter(tenant_profile__landlord=landlord)

        # ── Monthly revenue — last 6 months ───────────────────────────────────
        monthly_data = []
        for i in range(5, -1, -1):
            # Go back i months from current month
            month_offset = (today.month - i - 1) % 12 + 1
            year_offset = today.year - ((i - today.month + 1) // 12 + (1 if i >= today.month else 0))
            target = date(year_offset, month_offset, 1)

            paid = all_payments.filter(month=target, status='paid').aggregate(
                total=Sum('amount')
            )['total'] or 0

            unpaid = all_payments.filter(month=target).exclude(status='paid').aggregate(
                total=Sum('amount')
            )['total'] or 0

            monthly_data.append({
                'month': target.strftime('%b %Y'),
                'paid': float(paid),
                'unpaid': float(unpaid),
            })

        # ── Overall stats ─────────────────────────────────────────────────────
        total_tenants = profiles.count()
        total_rooms = Room.objects.filter(property__landlord=landlord).count()
        occupied_rooms = Room.objects.filter(property__landlord=landlord, is_occupied=True).count()
        occupancy_rate = round((occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0, 1)

        current_month_start = today.replace(day=1)
        current_month_payments = all_payments.filter(month=current_month_start)

        paid_this_month = current_month_payments.filter(status='paid').count()
        unpaid_this_month = current_month_payments.filter(status='unpaid').count()
        overdue_this_month = current_month_payments.filter(status='overdue').count()

        revenue_this_month = current_month_payments.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0

        unread_notifications = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()

        return Response({
            'monthly_revenue': monthly_data,
            'stats': {
                'total_tenants': total_tenants,
                'total_rooms': total_rooms,
                'occupied_rooms': occupied_rooms,
                'occupancy_rate': occupancy_rate,
                'paid_this_month': paid_this_month,
                'unpaid_this_month': unpaid_this_month,
                'overdue_this_month': overdue_this_month,
                'revenue_this_month': float(revenue_this_month),
                'unread_notifications': unread_notifications,
            }
        })
