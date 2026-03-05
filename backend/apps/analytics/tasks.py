"""Celery Beat task — generate hourly analytics snapshots."""
from celery import shared_task
import structlog

logger = structlog.get_logger(__name__)


@shared_task
def generate_daily_snapshot():
    from django.utils import timezone
    from django.db.models import Count, Avg, Sum
    from apps.trips.models import Trip, TripStatus
    from apps.users.models import User, UserRole
    from .models import DailySnapshot

    today = timezone.now().date()
    today_trips = Trip.objects.filter(requested_at__date=today)

    completed = today_trips.filter(status=TripStatus.COMPLETED)
    revenue = completed.aggregate(total=Sum("final_fare_toea"))["total"] or 0
    avg_fare = completed.aggregate(avg=Avg("final_fare_toea"))["avg"] or 0
    avg_duration = completed.aggregate(avg=Avg("duration_seconds"))["avg"] or 0

    snapshot, _ = DailySnapshot.objects.update_or_create(
        date=today,
        defaults={
            "total_trips": today_trips.count(),
            "completed_trips": completed.count(),
            "cancelled_trips": today_trips.filter(status=TripStatus.CANCELLED).count(),
            "active_drivers": User.objects.filter(role=UserRole.DRIVER, is_active=True).count(),
            "new_passengers": User.objects.filter(
                role=UserRole.PASSENGER, date_joined__date=today
            ).count(),
            "total_revenue_toea": int(revenue),
            "avg_fare_toea": int(avg_fare),
            "avg_trip_duration_seconds": int(avg_duration or 0),
        },
    )
    logger.info("snapshot_generated", date=str(today))
