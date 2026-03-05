from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import calculate_fare
from .models import FareConfig


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def estimate_fare(request):
    """Estimate fare before booking. Requires: category, distance_km, duration_minutes."""
    category = request.query_params.get("category", "standard")
    distance_km = float(request.query_params.get("distance_km", 0))
    duration_minutes = float(request.query_params.get("duration_minutes", 0))

    try:
        result = calculate_fare(category, distance_km, duration_minutes)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fare_configs(request):
    """Return all active fare configs for display in the app."""
    configs = FareConfig.objects.filter(is_active=True)
    return Response([
        {
            "category": c.category,
            "base_fare_pgk": c.base_fare_toea / 100,
            "per_km_pgk": c.per_km_toea / 100,
            "per_minute_pgk": c.per_minute_toea / 100,
            "minimum_fare_pgk": c.minimum_fare_toea / 100,
        }
        for c in configs
    ])
