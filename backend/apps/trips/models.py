"""
Trip lifecycle state machine:
REQUESTED -> DRIVER_MATCHED -> DRIVER_ARRIVED -> IN_PROGRESS -> COMPLETED
                                                             -> CANCELLED
"""
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _


class TripStatus(models.TextChoices):
    REQUESTED = "requested", _("Requested")
    DRIVER_MATCHED = "driver_matched", _("Driver Matched")
    DRIVER_ARRIVED = "driver_arrived", _("Driver Arrived")
    IN_PROGRESS = "in_progress", _("In Progress")
    COMPLETED = "completed", _("Completed")
    CANCELLED = "cancelled", _("Cancelled")


class PaymentMethod(models.TextChoices):
    CASH = "cash", _("Cash")
    CARD = "card", _("Card (Stripe)")
    MICASH = "micash", _("Digicel MiCash")
    MPAISA = "mpaisa", _("Vodafone M-PAiSA")
    WALLET = "wallet", _("In-App Wallet")


class CancellationReason(models.TextChoices):
    PASSENGER_CANCELLED = "passenger_cancelled", _("Passenger Cancelled")
    DRIVER_CANCELLED = "driver_cancelled", _("Driver Cancelled")
    NO_DRIVER_FOUND = "no_driver_found", _("No Driver Found")
    SYSTEM = "system", _("System")


class Trip(models.Model):
    passenger = models.ForeignKey(
        "users.User", on_delete=models.PROTECT, related_name="passenger_trips"
    )
    driver = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="driver_trips"
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.SET_NULL, null=True, blank=True
    )

    status = models.CharField(max_length=20, choices=TripStatus.choices, default=TripStatus.REQUESTED)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    is_paid = models.BooleanField(default=False)

    # Locations
    pickup_address = models.CharField(max_length=500)
    pickup_location = gis_models.PointField(srid=4326)
    dropoff_address = models.CharField(max_length=500)
    dropoff_location = gis_models.PointField(srid=4326)
    route_polyline = models.TextField(blank=True)  # encoded polyline from Google Maps

    # Fare (all in toea — 1 PGK = 100 toea)
    estimated_fare_toea = models.BigIntegerField(default=0)
    final_fare_toea = models.BigIntegerField(default=0)
    surge_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    platform_fee_toea = models.BigIntegerField(default=0)
    promo_discount_toea = models.BigIntegerField(default=0)
    promo_code = models.ForeignKey(
        "pricing.PromoCode", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Timing
    requested_at = models.DateTimeField(auto_now_add=True)
    matched_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Cancellation
    cancellation_reason = models.CharField(
        max_length=30, choices=CancellationReason.choices, blank=True
    )
    cancellation_note = models.TextField(blank=True)

    # Distance & Duration
    distance_km = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Emergency SOS snapshot
    sos_triggered = models.BooleanField(default=False)
    sos_location_snapshot = gis_models.PointField(null=True, blank=True, srid=4326)

    class Meta:
        verbose_name = _("Trip")
        verbose_name_plural = _("Trips")
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["passenger", "status"]),
            models.Index(fields=["driver", "status"]),
            models.Index(fields=["requested_at"]),
        ]
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Trip #{self.pk} — {self.passenger} → {self.status}"

    @property
    def fare_pgk(self):
        return self.final_fare_toea / 100
