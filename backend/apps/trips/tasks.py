"""Celery tasks for driver matching."""
import structlog
from celery import shared_task
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

logger = structlog.get_logger(__name__)


@shared_task(bind=True, max_retries=3)
def match_driver(self, trip_id: int):
    """Find the nearest available driver and assign the trip."""
    from .models import Trip, TripStatus, CancellationReason
    from apps.location.models import DriverLocation

    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return

    if trip.status != TripStatus.REQUESTED:
        return

    nearby = DriverLocation.objects.filter(
        is_online=True,
        has_active_trip=False,
        location__distance_lte=(trip.pickup_location, D(km=10)),
    ).annotate(
        distance=Distance("location", trip.pickup_location)
    ).select_related("driver__driver_profile").order_by("distance")[:5]

    if not nearby:
        logger.warning("no_drivers_found", trip_id=trip_id)
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=30)
        trip.status = TripStatus.CANCELLED
        trip.cancellation_reason = CancellationReason.NO_DRIVER_FOUND
        trip.save()
        # No driver was ever assigned, nothing to release
        return

    best = nearby[0]
    trip.driver = best.driver
    trip.status = TripStatus.DRIVER_MATCHED
    from django.utils import timezone
    trip.matched_at = timezone.now()
    trip.save()

    best.has_active_trip = True
    best.save()

    from apps.notifications.tasks import notify_driver_new_trip
    notify_driver_new_trip.delay(trip_id, best.driver_id)
    logger.info("driver_matched", trip_id=trip_id, driver_id=best.driver_id)
