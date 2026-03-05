from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        TRIP_UPDATE = "trip_update", "Trip Update"
        PAYMENT = "payment", "Payment"
        PROMO = "promo", "Promotion"
        SYSTEM = "system", "System"
        DRIVER_ARRIVED = "driver_arrived", "Driver Arrived"
        DOCUMENT_EXPIRY = "document_expiry", "Document Expiry"

    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]

    def __str__(self):
        return f"{self.notification_type}: {self.title}"
