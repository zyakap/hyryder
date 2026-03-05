"""Payments — Stripe, mobile money, cash, driver wallet & payouts."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class PaymentStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    COMPLETED = "completed", _("Completed")
    FAILED = "failed", _("Failed")
    REFUNDED = "refunded", _("Refunded")


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", _("Cash")
        CARD = "card", _("Card (Stripe)")
        MICASH = "micash", _("Digicel MiCash")
        MPAISA = "mpaisa", _("Vodafone M-PAiSA")
        WALLET = "wallet", _("In-App Wallet")

    trip = models.OneToOneField("trips.Trip", on_delete=models.PROTECT, related_name="payment")
    passenger = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="payments_made")
    driver = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="payments_received")
    amount_toea = models.BigIntegerField()
    method = models.CharField(max_length=20, choices=Method.choices)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    # Provider references
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    stripe_charge_id = models.CharField(max_length=100, blank=True)
    mobile_money_reference = models.CharField(max_length=100, blank=True)

    platform_fee_toea = models.BigIntegerField(default=0)
    driver_earnings_toea = models.BigIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Payment")
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["method", "status"]),
        ]

    def __str__(self):
        return f"Payment #{self.pk} — {self.amount_toea} toea ({self.method})"

    @property
    def amount_pgk(self):
        return self.amount_toea / 100


class DriverPayout(models.Model):
    """Driver requests a payout of their wallet balance."""
    class PayoutStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        PROCESSING = "processing", _("Processing")
        COMPLETED = "completed", _("Completed")
        FAILED = "failed", _("Failed")

    class PayoutMethod(models.TextChoices):
        BANK = "bank", _("BSP Bank Transfer")
        MICASH = "micash", _("Digicel MiCash")
        MPAISA = "mpaisa", _("Vodafone M-PAiSA")
        STRIPE = "stripe", _("Stripe Connect")

    driver = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="payouts")
    amount_toea = models.BigIntegerField()
    method = models.CharField(max_length=20, choices=PayoutMethod.choices)
    status = models.CharField(max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PENDING)
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Driver Payout")

    def __str__(self):
        return f"Payout #{self.pk} — {self.driver}: {self.amount_toea} toea"
