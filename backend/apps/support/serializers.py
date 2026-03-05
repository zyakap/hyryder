from rest_framework import serializers
from .models import SupportTicket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    class Meta:
        model = TicketMessage
        fields = ["id", "sender_name", "message", "attachment", "created_at"]
        read_only_fields = ["id", "sender_name", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    class Meta:
        model = SupportTicket
        fields = ["id", "category", "subject", "description", "status", "priority", "created_at", "messages"]
        read_only_fields = ["id", "status", "priority", "created_at"]
