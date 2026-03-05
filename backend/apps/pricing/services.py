"""Fare calculation service."""
from decimal import Decimal


def calculate_fare(
    category: str,
    distance_km: float,
    duration_minutes: float,
    surge_multiplier: Decimal = Decimal("1.00"),
    promo_code=None,
) -> dict:
    """
    Calculate trip fare. All monetary values returned in toea.
    Never uses floats for money — intermediate values are integers.
    """
    from .models import FareConfig

    try:
        config = FareConfig.objects.get(category=category, is_active=True)
    except FareConfig.DoesNotExist:
        raise ValueError(f"No active fare config for category: {category}")

    # Base calculation (in toea)
    distance_charge = int(config.per_km_toea * distance_km)
    time_charge = int(config.per_minute_toea * duration_minutes)
    subtotal = config.base_fare_toea + distance_charge + time_charge

    # Apply surge (multiply then round to nearest toea)
    surge = Decimal(str(surge_multiplier))
    surged = int(Decimal(subtotal) * surge)

    # Ensure minimum fare
    fare = max(surged, config.minimum_fare_toea)

    # Apply promo discount
    discount_toea = 0
    if promo_code and promo_code.is_valid():
        if promo_code.discount_type == "fixed":
            discount_toea = min(promo_code.discount_value, fare)
        elif promo_code.discount_type == "percent":
            pct_discount = int(fare * promo_code.discount_value // 10000)
            if promo_code.max_discount_toea:
                pct_discount = min(pct_discount, promo_code.max_discount_toea)
            discount_toea = pct_discount

    fare_after_promo = fare - discount_toea

    # Platform fee
    platform_fee = int(Decimal(fare_after_promo) * config.platform_fee_percent / 100)
    driver_earnings = fare_after_promo - platform_fee

    return {
        "base_fare_toea": config.base_fare_toea,
        "distance_charge_toea": distance_charge,
        "time_charge_toea": time_charge,
        "surge_multiplier": str(surge),
        "subtotal_toea": subtotal,
        "promo_discount_toea": discount_toea,
        "final_fare_toea": fare_after_promo,
        "platform_fee_toea": platform_fee,
        "driver_earnings_toea": driver_earnings,
    }
