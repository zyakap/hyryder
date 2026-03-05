"""Celery tasks for driver payouts."""
import structlog
from celery import shared_task

logger = structlog.get_logger(__name__)


@shared_task(bind=True, max_retries=3)
def process_driver_payout(self, payout_id: int):
    """Process a driver payout via Stripe Connect or mobile money."""
    from .models import DriverPayout
    try:
        payout = DriverPayout.objects.get(id=payout_id)
    except DriverPayout.DoesNotExist:
        return

    payout.status = "processing"
    payout.save()

    try:
        if payout.method == "stripe":
            import stripe
            from django.conf import settings
            stripe.api_key = settings.STRIPE_SECRET_KEY
            driver_profile = payout.driver.driver_profile
            transfer = stripe.Transfer.create(
                amount=payout.amount_toea,
                currency="pgk",
                destination=driver_profile.stripe_account_id,
                metadata={"payout_id": payout.id},
            )
            payout.reference = transfer.id
        else:
            # Mobile money / bank — log for manual processing
            logger.info("manual_payout_required", payout_id=payout.id, method=payout.method)
            payout.reference = f"MANUAL-{payout.id}"

        from django.utils import timezone
        payout.status = "completed"
        payout.completed_at = timezone.now()
        payout.save()
        logger.info("payout_completed", payout_id=payout_id)

    except Exception as exc:
        logger.error("payout_failed", payout_id=payout_id, error=str(exc))
        raise self.retry(exc=exc, countdown=300)
