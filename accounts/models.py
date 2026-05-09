from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('landlord', 'Landlord'),
        ('tenant', 'Tenant'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True)

    def is_landlord(self):
        return self.role == 'landlord'

    def is_tenant(self):
        return self.role == 'tenant'

    def __str__(self):
        return f"{self.username} ({self.role})"
