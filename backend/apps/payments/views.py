"""Payment views — Stripe PaymentIntent, cash confirm, payout request."""
import stripe
import structlog
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Payment, DriverPayout, PaymentStatus
from apps.trips.models import Trip, TripStatus

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = structlog.get_logger(__name__)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    """Create a Stripe PaymentIntent for a trip fare."""
    trip_id = request.data.get("trip_id")
    try:
        trip = Trip.objects.get(id=trip_id, passenger=request.user)
    except Trip.DoesNotExist:
        return Response({"detail": "Trip not found."}, status=404)

    # Amount is in smallest currency unit — toea for PGK
    intent = stripe.PaymentIntent.create(
        amount=trip.final_fare_toea,
        currency="pgk",
        metadata={"trip_id": trip.id, "passenger_id": request.user.id},
    )
    return Response({"client_secret": intent.client_secret, "payment_intent_id": intent.id})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirm_cash_payment(request):
    """Driver confirms receipt of cash payment."""
    trip_id = request.data.get("trip_id")
    try:
        trip = Trip.objects.get(id=trip_id, driver=request.user, status=TripStatus.COMPLETED)
    except Trip.DoesNotExist:
        return Response({"detail": "Trip not found."}, status=404)

    payment, _ = Payment.objects.get_or_create(
        trip=trip,
        defaults={
            "passenger": trip.passenger,
            "driver": trip.driver,
            "amount_toea": trip.final_fare_toea,
            "method": "cash",
            "platform_fee_toea": trip.platform_fee_toea,
            "driver_earnings_toea": trip.final_fare_toea - trip.platform_fee_toea,
        },
    )
    payment.status = PaymentStatus.COMPLETED
    payment.completed_at = timezone.now()
    payment.save()

    trip.is_paid = True
    trip.save()

    # Credit driver wallet
    profile = trip.driver.driver_profile
    profile.wallet_balance_toea += payment.driver_earnings_toea
    profile.total_earnings_toea += payment.driver_earnings_toea
    profile.save()

    return Response({"detail": "Cash payment confirmed.", "payment_id": payment.id})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def request_payout(request):
    """Driver requests a payout from their wallet balance."""
    amount_toea = request.data.get("amount_toea")
    method = request.data.get("method")

    try:
        profile = request.user.driver_profile
    except Exception:
        return Response({"detail": "Driver profile not found."}, status=400)

    if not amount_toea or int(amount_toea) > profile.wallet_balance_toea:
        return Response({"detail": "Insufficient wallet balance."}, status=400)

    payout = DriverPayout.objects.create(
        driver=request.user,
        amount_toea=int(amount_toea),
        method=method,
    )
    profile.wallet_balance_toea -= int(amount_toea)
    profile.save()

    from .tasks import process_driver_payout
    process_driver_payout.delay(payout.id)

    return Response({"detail": "Payout requested.", "payout_id": payout.id})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def driver_wallet(request):
    """Return driver's wallet balance and recent payouts."""
    try:
        profile = request.user.driver_profile
    except Exception:
        return Response({"detail": "Not a driver."}, status=403)

    recent_payouts = DriverPayout.objects.filter(driver=request.user).order_by("-created_at")[:10]

    return Response({
        "wallet_balance_toea": profile.wallet_balance_toea,
        "wallet_balance_pgk": profile.wallet_balance_toea / 100,
        "total_earnings_toea": profile.total_earnings_toea,
        "total_earnings_pgk": profile.total_earnings_toea / 100,
        "recent_payouts": [
            {
                "id": p.id,
                "amount_toea": p.amount_toea,
                "amount_pgk": p.amount_toea / 100,
                "method": p.method,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in recent_payouts
        ],
    })
