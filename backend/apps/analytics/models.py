"""Hourly analytics snapshots for dashboard charts."""
from django.db import models


class DailySnapshot(models.Model):
    date = models.DateField(unique=True)
    total_trips = models.PositiveIntegerField(default=0)
    completed_trips = models.PositiveIntegerField(default=0)
    cancelled_trips = models.PositiveIntegerField(default=0)
    active_drivers = models.PositiveIntegerField(default=0)
    new_passengers = models.PositiveIntegerField(default=0)
    total_revenue_toea = models.BigIntegerField(default=0)
    avg_trip_duration_seconds = models.PositiveIntegerField(default=0)
    avg_fare_toea = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Daily Snapshot"
        ordering = ["-date"]

    def __str__(self):
        return f"Snapshot {self.date}"
