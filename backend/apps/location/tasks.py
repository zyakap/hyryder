"""Celery tasks for surge pricing calculations."""
from celery import shared_task
import structlog

logger = structlog.get_logger(__name__)


@shared_task
def calculate_surge_pricing():
    """
    Run every 5 minutes via Celery Beat.
    Calculates demand/supply ratio per zone and updates SurgeZone multipliers.
    """
    from .models import SurgeZone, DriverLocation
    from apps.trips.models import Trip, TripStatus

    for zone in SurgeZone.objects.all():
        active_drivers = DriverLocation.objects.filter(
            is_online=True, has_active_trip=False, location__within=zone.zone
        ).count()
        pending_requests = Trip.objects.filter(
            status=TripStatus.REQUESTED, pickup_location__within=zone.zone
        ).count()

        zone.active_drivers = active_drivers
        zone.active_requests = pending_requests

        if active_drivers == 0:
            ratio = 3.0
        else:
            ratio = pending_requests / active_drivers

        if ratio >= 3.0:
            zone.multiplier = 2.5
        elif ratio >= 2.0:
            zone.multiplier = 2.0
        elif ratio >= 1.5:
            zone.multiplier = 1.5
        else:
            zone.multiplier = 1.0

        zone.save()
        logger.info("surge_updated", zone=zone.name, multiplier=str(zone.multiplier), ratio=ratio)
