from django.contrib import admin
from .models import Property, Room, TenantProfile, RentPayment

@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'landlord', 'room', 'move_in_date']
    list_filter = ['landlord']

@admin.register(RentPayment)
class RentPaymentAdmin(admin.ModelAdmin):
    list_display = ['tenant_profile', 'month', 'amount', 'status', 'paid_on']
    list_filter = ['status']
    list_editable = ['status']

admin.site.register(Property)
admin.site.register(Room)