"""
rentals/management/commands/generate_monthly_rents.py

A Django management command that creates RentPayment records
for all active tenants for the current month.

Run manually:   python manage.py generate_monthly_rents
Schedule it:    Use django-crontab or Railway's cron jobs to run on 1st of each month

This is a key feature that impresses interviewers — shows you know
Django beyond just views, and understand real-world automation.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from rentals.models import TenantProfile, RentPayment


class Command(BaseCommand):
    help = 'Generate rent payment records for all active tenants for the current month'

    def add_arguments(self, parser):
        # Optional: pass a specific month like --month 2026-06-01
        parser.add_argument(
            '--month',
            type=str,
            help='Month to generate rents for (YYYY-MM-DD format, uses 1st of month). Defaults to current month.',
        )

    def handle(self, *args, **options):
        # Determine the target month
        if options['month']:
            from datetime import datetime
            target_month = datetime.strptime(options['month'], '%Y-%m-%d').date().replace(day=1)
        else:
            today = timezone.now().date()
            target_month = today.replace(day=1)

        self.stdout.write(f'Generating rents for: {target_month.strftime("%B %Y")}')

        # Only active tenants (have a landlord and a room)
        active_profiles = TenantProfile.objects.filter(
            landlord__isnull=False,
            room__isnull=False
        ).select_related('tenant', 'room')

        created_count = 0
        skipped_count = 0

        for profile in active_profiles:
            payment, created = RentPayment.objects.get_or_create(
                tenant_profile=profile,
                month=target_month,
                defaults={
                    'amount': profile.room.rent_amount,
                    'status': 'unpaid',
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ Created: {profile.tenant.username} — Room {profile.room.room_number} — ₹{profile.room.rent_amount}'
                    )
                )
            else:
                skipped_count += 1
                self.stdout.write(
                    f'  → Skipped (already exists): {profile.tenant.username}'
                )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Done! Created: {created_count} | Skipped: {skipped_count}'))
