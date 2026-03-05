/**
 * Driver home screen — online/offline toggle, map, incoming trip requests.
 */
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LocationBroadcaster } from "../../services/locationBroadcast";
import { useDriverStore } from "../../stores/driverStore";

const PORT_MORESBY = { latitude: -9.4438, longitude: 147.1803, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function DriverHomeScreen() {
  const router = useRouter();
  const { isOnline, setOnline, activeTrip } = useDriverStore();
  const broadcasterRef = useRef<LocationBroadcaster | null>(null);

  const handleToggleOnline = async () => {
    if (!isOnline) {
      broadcasterRef.current = new LocationBroadcaster();
      await broadcasterRef.current.start();
      setOnline(true);
    } else {
      broadcasterRef.current?.stop();
      setOnline(false);
    }
  };

  useEffect(() => {
    return () => {
      broadcasterRef.current?.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={PORT_MORESBY}
        showsUserLocation
      />

      {/* Status Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>{isOnline ? "Online — Accepting Rides" : "Offline"}</Text>
      </SafeAreaView>

      {/* Active trip banner */}
      {activeTrip && (
        <TouchableOpacity
          style={styles.activeTripBanner}
          onPress={() => router.push(`/trip/${activeTrip.id}`)}
        >
          <Text style={styles.activeTripText}>Active Trip → {activeTrip.dropoff_address}</Text>
        </TouchableOpacity>
      )}

      {/* Online toggle */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomPanel}>
        <TouchableOpacity
          style={[styles.toggleButton, isOnline ? styles.toggleOff : styles.toggleOn]}
          onPress={handleToggleOnline}
        >
          <Text style={styles.toggleText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  header: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2347",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  dotOnline: { backgroundColor: "#22c55e" },
  dotOffline: { backgroundColor: "#ef4444" },
  statusText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  activeTripBanner: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    padding: 14,
  },
  activeTripText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F2347",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  toggleButton: { borderRadius: 12, padding: 18, alignItems: "center" },
  toggleOn: { backgroundColor: "#22c55e" },
  toggleOff: { backgroundColor: "#ef4444" },
  toggleText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
