"""Custom DRF exception handler."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import structlog

logger = structlog.get_logger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        logger.warning("api_exception", detail=response.data, status=response.status_code)
    return response
