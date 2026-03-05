"""Real-time driver location tracking with PostGIS."""
from django.contrib.gis.db import models as gis_models
from django.db import models


class DriverLocation(models.Model):
    """Current GPS position of a driver — updated every 3 seconds via WebSocket."""
    driver = models.OneToOneField(
        "users.User", on_delete=models.CASCADE, related_name="current_location"
    )
    location = gis_models.PointField(srid=4326)
    heading = models.FloatField(default=0.0)  # degrees
    speed_kmh = models.FloatField(default=0.0)
    is_online = models.BooleanField(default=False)
    has_active_trip = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Driver Location"
        indexes = [
            models.Index(fields=["is_online", "has_active_trip"]),
        ]

    def __str__(self):
        return f"{self.driver} @ ({self.location.y:.4f}, {self.location.x:.4f})"


class SurgeZone(models.Model):
    """Geographic polygon with a dynamic surge multiplier."""
    name = models.CharField(max_length=100)
    zone = gis_models.PolygonField(srid=4326)
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    active_drivers = models.PositiveIntegerField(default=0)
    active_requests = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Surge Zone"

    def __str__(self):
        return f"{self.name} (x{self.multiplier})"
