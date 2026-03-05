"""
ASGI config — Django Channels entry point.

Handles both HTTP (via Django ASGI) and WebSockets (via Django Channels).
"""

import os

import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from apps.location.routing import websocket_urlpatterns as location_ws  # noqa: E402
from apps.trips.routing import websocket_urlpatterns as trips_ws  # noqa: E402
from apps.support.routing import websocket_urlpatterns as support_ws  # noqa: E402

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    location_ws + trips_ws + support_ws
                )
            )
        ),
    }
)
