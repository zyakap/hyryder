/**Trip history screen."""
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { tripsService } from "../../services/trips";
import type { Trip } from "@hyryder/shared-types";

function TripCard({ trip }: { trip: Trip }) {
  const statusColor = trip.status === "completed" ? "#22c55e" : trip.status === "cancelled" ? "#ef4444" : "#f59e0b";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>Trip #{trip.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{trip.status.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.address} numberOfLines={1}>From: {trip.pickup_address}</Text>
      <Text style={styles.address} numberOfLines={1}>To: {trip.dropoff_address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.fare}>PGK {trip.fare_pgk.toFixed(2)}</Text>
        <Text style={styles.date}>{new Date(trip.requested_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ["trip-history"],
    queryFn: tripsService.getHistory,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1B4FFF" />;
  if (error) return <Text style={styles.error}>Failed to load trips.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id.toString()}
        renderItem={({ item }) => <TripCard trip={item} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet. Book your first ride!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardId: { fontSize: 15, fontWeight: "700", color: "#111" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  address: { fontSize: 13, color: "#666", marginBottom: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  fare: { fontSize: 16, fontWeight: "700", color: "#111" },
  date: { fontSize: 13, color: "#999" },
  error: { textAlign: "center", color: "#ef4444", marginTop: 40, fontSize: 16 },
  empty: { textAlign: "center", color: "#999", marginTop: 60, fontSize: 16 },
});
