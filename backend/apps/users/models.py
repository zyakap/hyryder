"""
Custom User model — supports both Passenger and Driver roles.
"""

from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    PASSENGER = "passenger", _("Passenger")
    DRIVER = "driver", _("Driver")
    ADMIN = "admin", _("Admin")
    SUPERADMIN = "superadmin", _("Super Admin")


class User(AbstractUser):
    username = None
    email = models.EmailField(_("email address"), blank=True)
    phone_number = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.PASSENGER)
    is_phone_verified = models.BooleanField(default=False)
    profile_photo = models.ImageField(upload_to="profile_photos/", null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    preferred_language = models.CharField(max_length=10, default="en")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_trips = models.PositiveIntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        indexes = [
            models.Index(fields=["phone_number"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.phone_number} ({self.role})"

    @property
    def is_passenger(self):
        return self.role == UserRole.PASSENGER

    @property
    def is_driver(self):
        return self.role == UserRole.DRIVER

    @property
    def is_admin_user(self):
        return self.role in (UserRole.ADMIN, UserRole.SUPERADMIN)


class PassengerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="passenger_profile")
    home_address = models.CharField(max_length=500, blank=True)
    home_location = gis_models.PointField(null=True, blank=True, srid=4326)
    work_address = models.CharField(max_length=500, blank=True)
    work_location = gis_models.PointField(null=True, blank=True, srid=4326)
    promo_credits_toea = models.BigIntegerField(default=0)

    class Meta:
        verbose_name = _("Passenger Profile")

    def __str__(self):
        return f"Passenger: {self.user}"


class DriverProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", _("Pending Review")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        SUSPENDED = "suspended", _("Suspended")

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="driver_profile")
    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING,
    )
    license_number = models.CharField(max_length=50, blank=True)
    license_expiry = models.DateField(null=True, blank=True)
    license_photo = models.FileField(upload_to="driver_docs/licenses/", null=True, blank=True)
    vehicle_registration = models.CharField(max_length=50, blank=True)
    registration_expiry = models.DateField(null=True, blank=True)
    registration_photo = models.FileField(upload_to="driver_docs/registrations/", null=True, blank=True)
    roadworthy_expiry = models.DateField(null=True, blank=True)
    roadworthy_photo = models.FileField(upload_to="driver_docs/roadworthy/", null=True, blank=True)
    police_clearance_photo = models.FileField(upload_to="driver_docs/police/", null=True, blank=True)
    police_clearance_expiry = models.DateField(null=True, blank=True)
    wallet_balance_toea = models.BigIntegerField(default=0)
    total_earnings_toea = models.BigIntegerField(default=0)
    acceptance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    stripe_account_id = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = _("Driver Profile")
        indexes = [models.Index(fields=["verification_status"])]

    def __str__(self):
        return f"Driver: {self.user} ({self.verification_status})"


class UserRating(models.Model):
    trip = models.ForeignKey("trips.Trip", on_delete=models.CASCADE, related_name="ratings")
    rated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings_given")
    rated_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings_received")
    score = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("trip", "rated_by")
        verbose_name = _("User Rating")

    def __str__(self):
        return f"{self.rated_by} -> {self.rated_user}: {self.score}/5"
