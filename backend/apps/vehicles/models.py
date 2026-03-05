"""Vehicle profiles and categories."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class VehicleCategory(models.TextChoices):
    STANDARD = "standard", _("Standard")
    PREMIUM = "premium", _("Premium")
    XL = "xl", _("XL")


class Vehicle(models.Model):
    driver = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="vehicles")
    category = models.CharField(max_length=20, choices=VehicleCategory.choices, default=VehicleCategory.STANDARD)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveSmallIntegerField()
    color = models.CharField(max_length=30)
    plate_number = models.CharField(max_length=20, unique=True)
    seats = models.PositiveSmallIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    photo = models.ImageField(upload_to="vehicle_photos/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Vehicle")
        indexes = [models.Index(fields=["driver", "is_active"])]

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.plate_number})"
