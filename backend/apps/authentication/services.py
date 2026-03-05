"""Business logic for OTP send/verify via Twilio Verify."""
import secrets
import structlog
from django.conf import settings
from django.utils import timezone

logger = structlog.get_logger(__name__)


def send_otp(phone_number: str) -> bool:
    """Send OTP via Twilio Verify API. Returns True on success."""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verifications.create(
            to=phone_number, channel="sms"
        )
        logger.info("otp_sent", phone_number=phone_number)
        return True
    except Exception as exc:
        logger.error("otp_send_failed", phone_number=phone_number, error=str(exc))
        return False


def verify_otp(phone_number: str, otp_code: str) -> bool:
    """Verify OTP via Twilio Verify API. Returns True if valid."""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        result = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verification_checks.create(
            to=phone_number, code=otp_code
        )
        return result.status == "approved"
    except Exception as exc:
        logger.error("otp_verify_failed", phone_number=phone_number, error=str(exc))
        return False
