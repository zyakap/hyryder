/**
 * Driver location broadcaster — sends GPS coordinates to Django Channels every 3 seconds.
 */
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8001";

export class LocationBroadcaster {
  private ws: WebSocket | null = null;
  private watchSubscription: Location.LocationSubscription | null = null;
  private reconnectAttempts = 0;

  async start(): Promise<void> {
    await this.connectWebSocket();
    await this.startWatching();
  }

  private async connectWebSocket(): Promise<void> {
    const token = await SecureStore.getItemAsync("access_token");
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/location/driver/?token=${token}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log("[LocationBroadcast] WebSocket connected");
    };

    this.ws.onclose = () => {
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
      this.reconnectAttempts++;
      setTimeout(() => this.connectWebSocket(), delay);
    };
  }

  private async startWatching(): Promise<void> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") return;

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (location) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading ?? 0,
              speed_kmh: (location.coords.speed ?? 0) * 3.6,
            })
          );
        }
      }
    );
  }

  stop(): void {
    this.watchSubscription?.remove();
    this.ws?.close();
    this.ws = null;
  }
}
