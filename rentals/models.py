from django.db import models
from django.conf import settings


class Property(models.Model):
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties',
        limit_choices_to={'role': 'landlord'}
    )
    name = models.CharField(max_length=200)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Properties'

    def __str__(self):
        return f"{self.name} — {self.landlord.username}"


class Room(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10)
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_occupied = models.BooleanField(default=False)

    def __str__(self):
        return f"Room {self.room_number} — {self.property.name}"


class TenantProfile(models.Model):
    tenant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tenant_profile',
        limit_choices_to={'role': 'tenant'}
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tenants',
        limit_choices_to={'role': 'landlord'}
    )
    room = models.OneToOneField(Room, on_delete=models.SET_NULL, null=True, blank=True)
    move_in_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.tenant.username} → {self.landlord.username if self.landlord else 'Unassigned'}"


class RentPayment(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('overdue', 'Overdue'),
    ]
    tenant_profile = models.ForeignKey(TenantProfile, on_delete=models.CASCADE, related_name='payments')
    month = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')
    paid_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant_profile', 'month')
        ordering = ['-month']

    def __str__(self):
        return f"{self.tenant_profile.tenant.username} — {self.month.strftime('%B %Y')} — {self.status}"


class Notification(models.Model):
    """In-app notifications for both landlords and tenants."""
    TYPE_CHOICES = [
        ('rent_due',    'Rent Due'),
        ('rent_paid',   'Rent Marked Paid'),
        ('rent_overdue','Rent Overdue'),
        ('tenant_added','Tenant Added'),
        ('welcome',     'Welcome'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} — {self.title}"
