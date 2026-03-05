"""Root URL configuration for the HyRyder backend."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/trips/", include("apps.trips.urls")),
    path("api/v1/location/", include("apps.location.urls")),
    path("api/v1/pricing/", include("apps.pricing.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/support/", include("apps.support.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/vehicles/", include("apps.vehicles.urls")),

    # OpenAPI Schema & Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Social Auth
    path("social-auth/", include("social_django.urls", namespace="social")),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
