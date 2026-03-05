"""Unit tests for fare calculation."""
import pytest
from decimal import Decimal
from apps.pricing.models import FareConfig, VehicleCategory
from apps.pricing.services import calculate_fare


@pytest.fixture
def standard_config(db):
    return FareConfig.objects.create(
        category=VehicleCategory.STANDARD,
        base_fare_toea=200,
        per_km_toea=150,
        per_minute_toea=30,
        minimum_fare_toea=500,
        platform_fee_percent=Decimal("20.00"),
    )


@pytest.mark.django_db
def test_basic_fare_calculation(standard_config):
    result = calculate_fare("standard", distance_km=5.0, duration_minutes=10.0)
    # base: 200, distance: 750, time: 300 => 1250; no surge; above minimum
    assert result["final_fare_toea"] == 1250
    assert result["base_fare_toea"] == 200


@pytest.mark.django_db
def test_minimum_fare_applied(standard_config):
    result = calculate_fare("standard", distance_km=0.5, duration_minutes=1.0)
    # 200 + 75 + 30 = 305 < 500 minimum
    assert result["final_fare_toea"] == 500


@pytest.mark.django_db
def test_surge_applied(standard_config):
    result = calculate_fare("standard", distance_km=5.0, duration_minutes=10.0, surge_multiplier=Decimal("2.0"))
    # base: 1250 * 2 = 2500
    assert result["final_fare_toea"] == 2500


@pytest.mark.django_db
def test_platform_fee_calculated(standard_config):
    result = calculate_fare("standard", distance_km=5.0, duration_minutes=10.0)
    expected_fee = int(Decimal("1250") * Decimal("20.00") / 100)
    assert result["platform_fee_toea"] == expected_fee
    assert result["driver_earnings_toea"] == result["final_fare_toea"] - result["platform_fee_toea"]
