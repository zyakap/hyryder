/**
 * Home screen — map with nearby drivers, pickup/dropoff selection, booking.
 */
import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { tripsService } from "../../services/trips";
import { useTripStore } from "../../stores/tripStore";
import type { LatLng } from "@hyryder/shared-types";

const PORT_MORESBY = { latitude: -9.4438, longitude: 147.1803, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const { pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, nearbyDrivers, setPickup } = useTripStore();

  // Request location permission and get user position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserLocation(coords);
      setPickup(coords, "Current Location");
      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    })();
  }, []);

  // Fetch nearby drivers every 10 seconds
  const { data: drivers } = useQuery({
    queryKey: ["nearby-drivers", userLocation?.lat, userLocation?.lng],
    queryFn: () => tripsService.getNearbyDrivers(userLocation!.lat, userLocation!.lng),
    enabled: !!userLocation,
    refetchInterval: 10000,
  });

  const handleBookRide = () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert("Set Destination", "Please set your dropoff location.");
      return;
    }
    router.push("/trip/booking");
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={PORT_MORESBY}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Nearby available drivers */}
        {(drivers ?? []).map((driver) => (
          <Marker
            key={driver.driver_id}
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            title={driver.driver_name}
            description={`★ ${driver.driver_rating}`}
          />
        ))}

        {/* Pickup marker */}
        {pickupLocation && (
          <Marker
            coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
            pinColor="#1B4FFF"
            title="Pickup"
          />
        )}

        {/* Dropoff marker */}
        {dropoffLocation && (
          <Marker
            coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}
            pinColor="#FF4444"
            title="Dropoff"
          />
        )}
      </MapView>

      {/* Bottom Sheet */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomSheet}>
        <Text style={styles.greeting}>Where to?</Text>

        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => router.push("/trip/select-location?type=pickup")}
        >
          <View style={styles.dot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {pickupAddress || "Set pickup location"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locationInput, styles.locationInputDestination]}
          onPress={() => router.push("/trip/select-location?type=dropoff")}
        >
          <View style={[styles.dot, styles.dotDestination]} />
          <Text
            style={[styles.locationText, !dropoffAddress && styles.locationPlaceholder]}
            numberOfLines={1}
          >
            {dropoffAddress || "Where are you going?"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bookButton, !dropoffLocation && styles.bookButtonDisabled]}
          onPress={handleBookRide}
          disabled={!dropoffLocation}
        >
          <Text style={styles.bookButtonText}>Book a Ride</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 16 },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  locationInputDestination: { marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1B4FFF", marginRight: 12 },
  dotDestination: { backgroundColor: "#FF4444" },
  locationText: { flex: 1, fontSize: 15, color: "#111" },
  locationPlaceholder: { color: "#999" },
  bookButton: {
    backgroundColor: "#1B4FFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  bookButtonDisabled: { backgroundColor: "#B0C4FF" },
  bookButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
