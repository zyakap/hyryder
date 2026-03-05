"""Fare config, surge pricing, and promo codes — all amounts in toea."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class VehicleCategory(models.TextChoices):
    STANDARD = "standard", _("Standard")
    PREMIUM = "premium", _("Premium")
    XL = "xl", _("XL")


class FareConfig(models.Model):
    """Configurable per-category fare settings — editable from Django Admin."""
    category = models.CharField(max_length=20, choices=VehicleCategory.choices, unique=True)
    base_fare_toea = models.BigIntegerField(default=200)       # 2 PGK base
    per_km_toea = models.BigIntegerField(default=150)          # 1.50 PGK per km
    per_minute_toea = models.BigIntegerField(default=30)       # 0.30 PGK per minute
    minimum_fare_toea = models.BigIntegerField(default=500)    # 5 PGK minimum
    platform_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)  # 20%
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fare Configuration"

    def __str__(self):
        return f"{self.get_category_display()} fare config"


class PromoCode(models.Model):
    """Promotional discount codes."""
    class DiscountType(models.TextChoices):
        FIXED = "fixed", _("Fixed Amount")
        PERCENT = "percent", _("Percentage")

    code = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    discount_value = models.BigIntegerField()  # toea for fixed; basis points for percent
    max_discount_toea = models.BigIntegerField(null=True, blank=True)
    minimum_fare_toea = models.BigIntegerField(default=0)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Promo Code"

    def __str__(self):
        return self.code

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        return True
