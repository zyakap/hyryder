/**
 * Active trip screen — live driver tracking on map, trip status updates.
 */
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { tripsService } from "../../services/trips";
import { TripWebSocket } from "../../services/websocket";
import { useTripStore } from "../../stores/tripStore";
import type { TripStatus, WebSocketMessage } from "@hyryder/shared-types";

const STATUS_LABELS: Record<TripStatus, string> = {
  requested: "Finding your driver...",
  driver_matched: "Driver is on the way",
  driver_arrived: "Driver has arrived",
  in_progress: "On your way",
  completed: "Trip Complete!",
  cancelled: "Trip Cancelled",
};

export default function ActiveTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tripId = parseInt(id, 10);
  const mapRef = useRef<MapView>(null);
  const wsRef = useRef<TripWebSocket | null>(null);
  const { driverLocation, driverHeading, updateDriverLocation } = useTripStore();
  const [tripStatus, setTripStatus] = useState<TripStatus>("requested");

  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripsService.getTrip(tripId),
    refetchInterval: 5000,
  });

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const handleMessage = (msg: WebSocketMessage) => {
      if (msg.event === "driver_location") {
        updateDriverLocation(msg.lat, msg.lng, msg.heading);
        mapRef.current?.animateCamera({ center: { latitude: msg.lat, longitude: msg.lng } });
      } else if (msg.event === "trip_status") {
        setTripStatus(msg.status);
        if (msg.status === "completed") {
          router.replace("/tabs");
        }
      }
    };

    wsRef.current = new TripWebSocket(tripId, handleMessage);
    wsRef.current.connect();
    return () => wsRef.current?.disconnect();
  }, [tripId]);

  const handleSOS = () => {
    Alert.alert("SOS Alert", "Are you in an emergency? This will alert our safety team.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send SOS",
        style: "destructive",
        onPress: async () => {
          if (trip?.pickup_lat) {
            await tripsService.triggerSOS(tripId, trip.pickup_lat, trip.pickup_lng);
            Alert.alert("SOS Sent", "Our safety team has been alerted with your location.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          trip
            ? { latitude: trip.pickup_lat, longitude: trip.pickup_lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }
            : undefined
        }
      >
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Your Driver"
          />
        )}
        {trip && (
          <>
            <Marker
              coordinate={{ latitude: trip.pickup_lat, longitude: trip.pickup_lng }}
              pinColor="#1B4FFF"
              title="Pickup"
            />
            <Marker
              coordinate={{ latitude: trip.dropoff_lat, longitude: trip.dropoff_lng }}
              pinColor="#FF4444"
              title="Dropoff"
            />
          </>
        )}
      </MapView>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{STATUS_LABELS[tripStatus]}</Text>
        {trip?.driver_name && <Text style={styles.driverName}>{trip.driver_name}</Text>}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {trip && (
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fare}>PGK {(trip.estimated_fare_toea / 100).toFixed(2)}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Text style={styles.sosText}>🆘 SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  statusBar: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusText: { fontSize: 18, fontWeight: "700", color: "#111" },
  driverName: { fontSize: 14, color: "#666", marginTop: 4 },
  bottomPanel: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  fareLabel: { fontSize: 15, color: "#666" },
  fare: { fontSize: 18, fontWeight: "700", color: "#111" },
  sosButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  sosText: { fontSize: 16, fontWeight: "700", color: "#ef4444" },
});
