"""Unit tests for authentication flows."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.users.models import User, UserRole


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def passenger_user(db):
    return User.objects.create_user(
        phone_number="+6757100001",
        password="testpass123",
        role=UserRole.PASSENGER,
        is_phone_verified=True,
    )


@pytest.fixture
def driver_user(db):
    return User.objects.create_user(
        phone_number="+6757100002",
        password="testpass123",
        role=UserRole.DRIVER,
        is_phone_verified=True,
    )


@pytest.mark.django_db
def test_user_creation(passenger_user):
    assert passenger_user.phone_number == "+6757100001"
    assert passenger_user.role == UserRole.PASSENGER
    assert passenger_user.is_phone_verified is True


@pytest.mark.django_db
def test_driver_profile_created_on_driver_user(driver_user):
    assert hasattr(driver_user, "driver_profile")


@pytest.mark.django_db
def test_passenger_profile_created_on_passenger_user(passenger_user):
    assert hasattr(passenger_user, "passenger_profile")


@pytest.mark.django_db
def test_me_endpoint_requires_auth(api_client):
    url = reverse("user-me")
    response = api_client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_endpoint_returns_user(api_client, passenger_user):
    api_client.force_authenticate(user=passenger_user)
    url = reverse("user-me")
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data["phone_number"] == passenger_user.phone_number
    assert response.data["role"] == UserRole.PASSENGER
