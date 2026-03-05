"""Signals for user-related events."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserRole, PassengerProfile, DriverProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == UserRole.PASSENGER:
            PassengerProfile.objects.get_or_create(user=instance)
        elif instance.role == UserRole.DRIVER:
            DriverProfile.objects.get_or_create(user=instance)
