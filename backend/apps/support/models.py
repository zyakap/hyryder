from django.db import models
from django.utils.translation import gettext_lazy as _


class SupportTicket(models.Model):
    class TicketStatus(models.TextChoices):
        OPEN = "open", _("Open")
        IN_PROGRESS = "in_progress", _("In Progress")
        RESOLVED = "resolved", _("Resolved")
        CLOSED = "closed", _("Closed")

    class TicketCategory(models.TextChoices):
        TRIP_ISSUE = "trip_issue", _("Trip Issue")
        PAYMENT = "payment", _("Payment")
        DRIVER_BEHAVIOUR = "driver_behaviour", _("Driver Behaviour")
        APP_BUG = "app_bug", _("App Bug")
        ACCOUNT = "account", _("Account")
        OTHER = "other", _("Other")

    user = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="support_tickets")
    trip = models.ForeignKey("trips.Trip", on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets")
    assigned_to = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tickets"
    )
    category = models.CharField(max_length=30, choices=TicketCategory.choices, default=TicketCategory.OTHER)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=TicketStatus.choices, default=TicketStatus.OPEN)
    priority = models.PositiveSmallIntegerField(default=3)  # 1=Critical, 5=Low
    resolution_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Support Ticket")
        ordering = ["priority", "-created_at"]
        indexes = [models.Index(fields=["status", "category"])]

    def __str__(self):
        return f"Ticket #{self.pk}: {self.subject}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey("users.User", on_delete=models.PROTECT)
    message = models.TextField()
    attachment = models.FileField(upload_to="support_attachments/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg #{self.pk} on Ticket #{self.ticket_id}"
