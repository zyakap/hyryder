/**
 * WebSocket service — connects to Django Channels for real-time trip updates.
 * Implements reconnection with exponential backoff.
 */
import * as SecureStore from "expo-secure-store";
import type { WebSocketMessage } from "@hyryder/shared-types";

const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8001";

type MessageHandler = (message: WebSocketMessage) => void;

export class TripWebSocket {
  private ws: WebSocket | null = null;
  private tripId: number;
  private onMessage: MessageHandler;
  private reconnectAttempts = 0;
  private maxReconnects = 5;

  constructor(tripId: number, onMessage: MessageHandler) {
    this.tripId = tripId;
    this.onMessage = onMessage;
  }

  async connect(): Promise<void> {
    const token = await SecureStore.getItemAsync("access_token");
    const url = `${WS_BASE_URL}/ws/trips/${this.tripId}/?token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log(`[WS] Connected to trip ${this.tripId}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        this.onMessage(data);
      } catch {
        console.warn("[WS] Failed to parse message:", event.data);
      }
    };

    this.ws.onclose = () => {
      this.scheduleReconnect();
    };

    this.ws.onerror = (e) => {
      console.error("[WS] Error:", e);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) return;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
