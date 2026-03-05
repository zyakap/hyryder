"""Celery tasks for sending push notifications and SMS alerts."""
import structlog
import requests
from celery import shared_task
from django.conf import settings

logger = structlog.get_logger(__name__)


def _send_onesignal_notification(user_ids: list, title: str, body: str, data: dict = None):
    """Send push notification via OneSignal REST API."""
    payload = {
        "app_id": settings.ONESIGNAL_APP_ID,
        "include_external_user_ids": [str(uid) for uid in user_ids],
        "headings": {"en": title},
        "contents": {"en": body},
        "data": data or {},
    }
    try:
        response = requests.post(
            "https://onesignal.com/api/v1/notifications",
            json=payload,
            headers={
                "Authorization": f"Basic {settings.ONESIGNAL_REST_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        logger.info("push_sent", user_ids=user_ids, title=title)
    except Exception as exc:
        logger.error("push_failed", error=str(exc), user_ids=user_ids)


@shared_task
def notify_trip_status_change(trip_id: int, new_status: str):
    """Notify passenger (and driver) when trip status changes."""
    from apps.trips.models import Trip
    from .models import Notification

    try:
        trip = Trip.objects.select_related("passenger", "driver").get(id=trip_id)
    except Trip.DoesNotExist:
        return

    status_messages = {
        "driver_matched": ("Driver Found!", f"Your driver is on the way."),
        "driver_arrived": ("Driver Arrived", "Your driver is waiting at the pickup point."),
        "in_progress": ("Trip Started", "Your trip is underway. Enjoy the ride!"),
        "completed": ("Trip Completed", f"Your fare is {trip.final_fare_toea / 100:.2f} PGK. Thanks for riding!"),
        "cancelled": ("Trip Cancelled", "Your trip has been cancelled."),
    }
    title, body = status_messages.get(new_status, ("Trip Update", f"Status: {new_status}"))

    Notification.objects.create(
        user=trip.passenger,
        notification_type="trip_update",
        title=title,
        body=body,
        data={"trip_id": trip_id, "status": new_status},
    )
    _send_onesignal_notification([trip.passenger_id], title, body, {"trip_id": trip_id, "status": new_status})


@shared_task
def notify_driver_new_trip(trip_id: int, driver_id: int):
    """Notify driver of a new trip assignment."""
    from apps.trips.models import Trip
    from .models import Notification

    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return

    title = "New Trip Request"
    body = f"Pickup: {trip.pickup_address}"

    Notification.objects.create(
        user_id=driver_id,
        notification_type="trip_update",
        title=title,
        body=body,
        data={"trip_id": trip_id},
    )
    _send_onesignal_notification([driver_id], title, body, {"trip_id": trip_id})


@shared_task
def send_document_expiry_reminders():
    """
    Celery Beat task — runs daily.
    Reminds drivers whose documents expire within 48 hours.
    """
    from apps.users.models import DriverProfile
    from django.utils import timezone
    from datetime import timedelta
    from .models import Notification

    threshold = timezone.now().date() + timedelta(hours=48)
    expiring = DriverProfile.objects.filter(
        license_expiry__lte=threshold, license_expiry__gte=timezone.now().date()
    ).select_related("user")

    for profile in expiring:
        title = "Document Expiry Reminder"
        body = f"Your driver's licence expires on {profile.license_expiry}. Please renew it to continue driving."
        Notification.objects.create(
            user=profile.user,
            notification_type="document_expiry",
            title=title,
            body=body,
        )
        _send_onesignal_notification([profile.user_id], title, body)
        logger.info("expiry_reminder_sent", driver_id=profile.user_id)
