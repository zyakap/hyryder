"""Views for the trip lifecycle."""
import structlog
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Trip, TripStatus, CancellationReason
from .serializers import TripCreateSerializer, TripSerializer
from apps.notifications.tasks import notify_trip_status_change

logger = structlog.get_logger(__name__)


class RequestTripView(generics.CreateAPIView):
    serializer_class = TripCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        trip = serializer.save()
        from .tasks import match_driver
        match_driver.delay(trip.id)
        logger.info("trip_requested", trip_id=trip.id, passenger_id=trip.passenger_id)


class TripDetailView(generics.RetrieveAPIView):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Trip.objects.filter(
            models.Q(passenger=user) | models.Q(driver=user)
        ).select_related("passenger", "driver", "vehicle")


class PassengerTripHistoryView(generics.ListAPIView):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(passenger=self.request.user).select_related("driver", "vehicle")


class DriverTripHistoryView(generics.ListAPIView):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(driver=self.request.user).select_related("passenger", "vehicle")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def update_trip_status(request, trip_id):
    """Driver endpoint to advance the trip status."""
    try:
        trip = Trip.objects.get(id=trip_id, driver=request.user)
    except Trip.DoesNotExist:
        return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    valid_transitions = {
        TripStatus.DRIVER_MATCHED: TripStatus.DRIVER_ARRIVED,
        TripStatus.DRIVER_ARRIVED: TripStatus.IN_PROGRESS,
        TripStatus.IN_PROGRESS: TripStatus.COMPLETED,
    }
    if new_status not in valid_transitions.get(trip.status, []):
        return Response({"detail": f"Invalid status transition from {trip.status} to {new_status}."}, status=400)

    now = timezone.now()
    if new_status == TripStatus.DRIVER_ARRIVED:
        trip.arrived_at = now
    elif new_status == TripStatus.IN_PROGRESS:
        trip.started_at = now
    elif new_status == TripStatus.COMPLETED:
        trip.completed_at = now

    trip.status = new_status
    trip.save()
    notify_trip_status_change.delay(trip.id, new_status)
    return Response(TripSerializer(trip).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_trip(request, trip_id):
    """Cancel a trip — allowed for passenger (before IN_PROGRESS) or driver (before DRIVER_ARRIVED)."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({"detail": "Trip not found."}, status=404)

    user = request.user
    if trip.status in (TripStatus.IN_PROGRESS, TripStatus.COMPLETED, TripStatus.CANCELLED):
        return Response({"detail": "Cannot cancel this trip."}, status=400)

    if user == trip.passenger:
        trip.cancellation_reason = CancellationReason.PASSENGER_CANCELLED
    elif user == trip.driver:
        trip.cancellation_reason = CancellationReason.DRIVER_CANCELLED
    else:
        return Response({"detail": "Not authorized."}, status=403)

    trip.status = TripStatus.CANCELLED
    trip.cancelled_at = timezone.now()
    trip.cancellation_note = request.data.get("note", "")
    trip.save()
    notify_trip_status_change.delay(trip.id, TripStatus.CANCELLED)
    return Response(TripSerializer(trip).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def sos_trigger(request, trip_id):
    """Passenger triggers SOS — snapshot GPS and notify emergency contacts."""
    try:
        trip = Trip.objects.get(id=trip_id, passenger=request.user, status=TripStatus.IN_PROGRESS)
    except Trip.DoesNotExist:
        return Response({"detail": "Active trip not found."}, status=404)

    from django.contrib.gis.geos import Point
    lat = request.data.get("lat")
    lng = request.data.get("lng")
    if lat and lng:
        trip.sos_location_snapshot = Point(float(lng), float(lat), srid=4326)
    trip.sos_triggered = True
    trip.save()
    logger.warning("sos_triggered", trip_id=trip.id, passenger_id=request.user.id)
    return Response({"detail": "SOS alert sent."})
