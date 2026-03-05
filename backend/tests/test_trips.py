"""Unit tests for trip lifecycle."""
import pytest
from django.contrib.gis.geos import Point
from apps.users.models import User, UserRole
from apps.trips.models import Trip, TripStatus, PaymentMethod


@pytest.fixture
def passenger(db):
    return User.objects.create_user(
        phone_number="+6757200001",
        password="testpass",
        role=UserRole.PASSENGER,
        is_phone_verified=True,
    )


@pytest.fixture
def driver(db):
    return User.objects.create_user(
        phone_number="+6757200002",
        password="testpass",
        role=UserRole.DRIVER,
        is_phone_verified=True,
    )


@pytest.fixture
def trip(db, passenger, driver):
    return Trip.objects.create(
        passenger=passenger,
        driver=driver,
        pickup_address="Jackson's Airport, Port Moresby",
        pickup_location=Point(147.2200, -9.4338, srid=4326),
        dropoff_address="Port Moresby General Hospital",
        dropoff_location=Point(147.1803, -9.4438, srid=4326),
        status=TripStatus.DRIVER_MATCHED,
        payment_method=PaymentMethod.CASH,
        estimated_fare_toea=1500,
        final_fare_toea=1500,
    )


@pytest.mark.django_db
def test_trip_created_with_correct_status(trip):
    assert trip.status == TripStatus.DRIVER_MATCHED
    assert trip.passenger is not None
    assert trip.driver is not None


@pytest.mark.django_db
def test_fare_pgk_property(trip):
    assert trip.fare_pgk == 15.0


@pytest.mark.django_db
def test_trip_ordering(db, trip, passenger, driver):
    trip2 = Trip.objects.create(
        passenger=passenger,
        driver=driver,
        pickup_address="Town",
        pickup_location=Point(147.18, -9.44, srid=4326),
        dropoff_address="Boroko",
        dropoff_location=Point(147.19, -9.45, srid=4326),
        status=TripStatus.REQUESTED,
        payment_method=PaymentMethod.CASH,
    )
    trips = list(Trip.objects.all())
    assert trips[0] == trip2  # most recent first
