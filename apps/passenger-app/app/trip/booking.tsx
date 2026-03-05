/**
 * Booking confirmation screen — shows fare estimate and payment method selection.
 */
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { tripsService } from "../../services/trips";
import { useTripStore } from "../../stores/tripStore";
import type { PaymentMethod } from "@hyryder/shared-types";

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card (Visa / Mastercard)" },
  { key: "micash", label: "Digicel MiCash" },
  { key: "mpaisa", label: "Vodafone M-PAiSA" },
];

export default function BookingScreen() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const { pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, setActiveTrip } = useTripStore();

  const { data: estimate, isLoading: estimating } = useQuery({
    queryKey: ["fare-estimate"],
    queryFn: () =>
      tripsService.estimateFare({ category: "standard", distance_km: 5, duration_minutes: 15 }),
    enabled: !!(pickupLocation && dropoffLocation),
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      tripsService.requestTrip({
        pickup_address: pickupAddress,
        pickup_lat: pickupLocation!.lat,
        pickup_lng: pickupLocation!.lng,
        dropoff_address: dropoffAddress,
        dropoff_lat: dropoffLocation!.lat,
        dropoff_lng: dropoffLocation!.lng,
        payment_method: paymentMethod,
      }),
    onSuccess: (trip) => {
      setActiveTrip(trip);
      router.replace(`/trip/${trip.id}`);
    },
    onError: () => Alert.alert("Booking Failed", "Could not book your ride. Please try again."),
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Confirm your ride</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PICKUP</Text>
        <Text style={styles.address}>{pickupAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DROPOFF</Text>
        <Text style={styles.address}>{dropoffAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ESTIMATED FARE</Text>
        {estimating ? (
          <ActivityIndicator color="#1B4FFF" />
        ) : (
          <Text style={styles.fare}>
            PGK {estimate ? (estimate.final_fare_toea / 100).toFixed(2) : "---"}
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.key}
          style={[styles.paymentOption, paymentMethod === method.key && styles.paymentSelected]}
          onPress={() => setPaymentMethod(method.key)}
        >
          <View style={[styles.radio, paymentMethod === method.key && styles.radioSelected]} />
          <Text style={styles.paymentLabel}>{method.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, bookMutation.isPending && styles.buttonDisabled]}
        onPress={() => bookMutation.mutate()}
        disabled={bookMutation.isPending}
      >
        <Text style={styles.buttonText}>{bookMutation.isPending ? "Booking..." : "Confirm Ride"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { fontSize: 16, color: "#1B4FFF" },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#999", letterSpacing: 1, marginBottom: 6 },
  address: { fontSize: 15, color: "#111" },
  fare: { fontSize: 28, fontWeight: "800", color: "#1B4FFF" },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  paymentSelected: { borderColor: "#1B4FFF", backgroundColor: "#EEF2FF" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#ccc", marginRight: 12 },
  radioSelected: { borderColor: "#1B4FFF", backgroundColor: "#1B4FFF" },
  paymentLabel: { fontSize: 15, color: "#111" },
  button: {
    backgroundColor: "#1B4FFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
