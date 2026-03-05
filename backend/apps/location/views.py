"""REST endpoints for nearby drivers and surge zone queries."""
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from .models import DriverLocation, SurgeZone
from .serializers import NearbyDriverSerializer


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def nearby_drivers(request):
    """Return list of available drivers within radius of given lat/lng."""
    lat = request.query_params.get("lat")
    lng = request.query_params.get("lng")
    radius_km = float(request.query_params.get("radius_km", 5))

    if not lat or not lng:
        return Response({"detail": "lat and lng are required."}, status=400)

    passenger_point = Point(float(lng), float(lat), srid=4326)

    drivers = DriverLocation.objects.filter(
        is_online=True,
        has_active_trip=False,
        location__distance_lte=(passenger_point, D(km=radius_km)),
    ).annotate(
        distance=Distance("location", passenger_point)
    ).select_related("driver").order_by("distance")[:10]

    serializer = NearbyDriverSerializer(drivers, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def surge_zones(request):
    """Return all active surge zones with their multipliers."""
    zones = SurgeZone.objects.filter(multiplier__gt=1.0)
    data = [
        {
            "name": z.name,
            "multiplier": str(z.multiplier),
            "updated_at": z.updated_at,
        }
        for z in zones
    ]
    return Response(data)
