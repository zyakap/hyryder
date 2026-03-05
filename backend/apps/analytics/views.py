"""Analytics API endpoints for the admin dashboard."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum
from .models import DailySnapshot


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_summary(request):
    """Return last 30 days of daily snapshots for the admin dashboard."""
    snapshots = DailySnapshot.objects.order_by("-date")[:30]
    data = [
        {
            "date": s.date,
            "total_trips": s.total_trips,
            "completed_trips": s.completed_trips,
            "cancelled_trips": s.cancelled_trips,
            "total_revenue_pgk": s.total_revenue_toea / 100,
            "avg_fare_pgk": s.avg_fare_toea / 100,
            "active_drivers": s.active_drivers,
            "new_passengers": s.new_passengers,
        }
        for s in snapshots
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def revenue_summary(request):
    """Aggregate revenue for a given date range."""
    from_date = request.query_params.get("from")
    to_date = request.query_params.get("to")
    qs = DailySnapshot.objects.all()
    if from_date:
        qs = qs.filter(date__gte=from_date)
    if to_date:
        qs = qs.filter(date__lte=to_date)
    totals = qs.aggregate(
        total_revenue=Sum("total_revenue_toea"),
        total_trips=Sum("total_trips"),
        completed_trips=Sum("completed_trips"),
    )
    return Response({
        "total_revenue_pgk": (totals["total_revenue"] or 0) / 100,
        "total_trips": totals["total_trips"] or 0,
        "completed_trips": totals["completed_trips"] or 0,
    })
