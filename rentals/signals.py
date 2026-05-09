"""
rentals/signals.py

Django Signals — automatic side effects when model events happen.
This shows interviewers you understand Django's architecture deeply.

Signals fire automatically:
- When a TenantProfile is saved → send welcome notification
- When a RentPayment status changes → notify both landlord and tenant
- When a tenant is assigned → notify tenant
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import TenantProfile, RentPayment, Notification


# ── Notify tenant when they are assigned to a landlord ────────────────────────
@receiver(post_save, sender=TenantProfile)
def notify_tenant_on_assignment(sender, instance, created, **kwargs):
    """
    Fires when a TenantProfile is created or updated.
    If landlord is set, send a welcome notification to tenant.
    """
    if instance.landlord and instance.room:
        # Avoid duplicate notifications — only if not already notified
        already_notified = Notification.objects.filter(
            user=instance.tenant,
            type='tenant_added'
        ).exists()

        if not already_notified:
            Notification.objects.create(
                user=instance.tenant,
                type='tenant_added',
                title='You have been assigned a room!',
                message=(
                    f"Welcome! Your landlord {instance.landlord.get_full_name() or instance.landlord.username} "
                    f"has assigned you to Room {instance.room.room_number}. "
                    f"Your monthly rent is ₹{instance.room.rent_amount}."
                )
            )

            # Also notify the landlord
            Notification.objects.create(
                user=instance.landlord,
                type='tenant_added',
                title='New tenant added',
                message=(
                    f"{instance.tenant.get_full_name() or instance.tenant.username} "
                    f"has been assigned to Room {instance.room.room_number}."
                )
            )

            # Send email to tenant if email exists (optional — works if email configured)
            if instance.tenant.email and getattr(settings, 'EMAIL_HOST_USER', None):
                try:
                    send_mail(
                        subject='Welcome to Rentify — Room Assigned',
                        message=(
                            f"Hi {instance.tenant.first_name or instance.tenant.username},\n\n"
                            f"You have been assigned Room {instance.room.room_number} "
                            f"with a monthly rent of ₹{instance.room.rent_amount}.\n\n"
                            f"Login to Rentify to view your dashboard.\n\n"
                            f"— Rentify"
                        ),
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[instance.tenant.email],
                        fail_silently=True,   # don't crash if email fails
                    )
                except Exception:
                    pass


# ── Notify when rent status changes ───────────────────────────────────────────
# Store old status before save so we can compare
_old_payment_status = {}

@receiver(pre_save, sender=RentPayment)
def capture_old_rent_status(sender, instance, **kwargs):
    """Capture the old status before it gets overwritten."""
    if instance.pk:
        try:
            old = RentPayment.objects.get(pk=instance.pk)
            _old_payment_status[instance.pk] = old.status
        except RentPayment.DoesNotExist:
            pass


@receiver(post_save, sender=RentPayment)
def notify_on_rent_status_change(sender, instance, created, **kwargs):
    """
    Fires after a RentPayment is saved.
    Notifies landlord and tenant when status changes.
    """
    old_status = _old_payment_status.pop(instance.pk, None)
    new_status = instance.status
    tenant_user = instance.tenant_profile.tenant
    landlord_user = instance.tenant_profile.landlord
    month_str = instance.month.strftime('%B %Y')

    if created:
        # New payment record created — notify tenant
        Notification.objects.create(
            user=tenant_user,
            type='rent_due',
            title=f'Rent due for {month_str}',
            message=f'Your rent of ₹{instance.amount} for {month_str} is now due.'
        )
        return

    if old_status == new_status:
        return  # no change, don't notify

    if new_status == 'paid':
        # Notify tenant
        Notification.objects.create(
            user=tenant_user,
            type='rent_paid',
            title=f'Rent paid for {month_str}',
            message=f'Your rent of ₹{instance.amount} for {month_str} has been marked as paid.'
        )
        # Notify landlord
        if landlord_user:
            Notification.objects.create(
                user=landlord_user,
                type='rent_paid',
                title=f'Rent received — {tenant_user.get_full_name() or tenant_user.username}',
                message=f'₹{instance.amount} rent for {month_str} marked as paid.'
            )

    elif new_status == 'overdue':
        Notification.objects.create(
            user=tenant_user,
            type='rent_overdue',
            title=f'Rent overdue for {month_str}',
            message=f'Your rent of ₹{instance.amount} for {month_str} is overdue. Please pay immediately.'
        )
        if landlord_user:
            Notification.objects.create(
                user=landlord_user,
                type='rent_overdue',
                title=f'Overdue rent — {tenant_user.get_full_name() or tenant_user.username}',
                message=f'₹{instance.amount} rent for {month_str} is overdue.'
            )
