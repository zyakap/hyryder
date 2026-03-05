"""Authentication views — OTP send/verify, token refresh, logout."""
import structlog
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import SendOTPSerializer, VerifyOTPSerializer
from .services import send_otp, verify_otp

User = get_user_model()
logger = structlog.get_logger(__name__)


class OTPThrottle(ScopedRateThrottle):
    scope = "otp"


@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp_view(request):
    """
    Send a 6-digit OTP to the given phone number via SMS.
    Rate limited to 5 attempts per hour per phone.
    """
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone_number = serializer.validated_data["phone_number"]
    role = serializer.validated_data["role"]

    success = send_otp(phone_number)
    if not success:
        return Response(
            {"detail": "Failed to send OTP. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({"detail": "OTP sent successfully.", "phone_number": phone_number})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """
    Verify OTP and return JWT access + refresh tokens.
    Creates the user account if it does not yet exist.
    """
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone_number = serializer.validated_data["phone_number"]
    otp_code = serializer.validated_data["otp_code"]
    role = request.data.get("role", "passenger")

    if not verify_otp(phone_number, otp_code):
        return Response(
            {"detail": "Invalid or expired OTP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user, created = User.objects.get_or_create(
        phone_number=phone_number,
        defaults={"role": role, "is_phone_verified": True},
    )
    if not created and not user.is_phone_verified:
        user.is_phone_verified = True
        user.save(update_fields=["is_phone_verified"])

    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["phone_number"] = user.phone_number

    logger.info("user_authenticated", user_id=user.id, created=created)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "is_new_user": created,
        "user": {
            "id": user.id,
            "phone_number": user.phone_number,
            "role": user.role,
            "is_phone_verified": user.is_phone_verified,
        },
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Blacklist the provided refresh token."""
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "Successfully logged out."})
