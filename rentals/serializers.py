from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TenantProfile, Room, RentPayment, Property, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', ''),
            phone=validated_data.get('phone', ''),
        )
        return user


class RentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentPayment
        fields = ['id', 'month', 'amount', 'status', 'paid_on', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'rent_amount', 'is_occupied', 'property_name']


class TenantDetailSerializer(serializers.ModelSerializer):
    tenant = UserSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    payments = RentPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = TenantProfile
        fields = ['id', 'tenant', 'room', 'move_in_date', 'payments']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at']


class PropertySerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    total_rooms = serializers.SerializerMethodField()
    occupied_rooms = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'created_at', 'rooms', 'total_rooms', 'occupied_rooms']

    def get_total_rooms(self, obj):
        return obj.rooms.count()

    def get_occupied_rooms(self, obj):
        return obj.rooms.filter(is_occupied=True).count()
