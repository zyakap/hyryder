/**Driver earnings and wallet screen."""
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "../../../apps/passenger-app/services/api";
import type { DriverWallet } from "@hyryder/shared-types";

export default function EarningsScreen() {
  const { data: wallet, isLoading } = useQuery<DriverWallet>({
    queryKey: ["driver-wallet"],
    queryFn: async () => {
      const res = await apiClient.get("/payments/wallet/");
      return res.data;
    },
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      await apiClient.post("/payments/payout/request/", {
        amount_toea: wallet?.wallet_balance_toea,
        method: "micash",
      });
    },
    onSuccess: () => Alert.alert("Payout Requested", "Your payout is being processed."),
    onError: () => Alert.alert("Error", "Failed to request payout."),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#F59E0B" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>WALLET BALANCE</Text>
        <Text style={styles.balance}>PGK {wallet?.wallet_balance_pgk.toFixed(2) ?? "0.00"}</Text>

        <TouchableOpacity
          style={[styles.payoutButton, !wallet?.wallet_balance_toea && styles.payoutDisabled]}
          onPress={() => requestPayout.mutate()}
          disabled={!wallet?.wallet_balance_toea || requestPayout.isPending}
        >
          <Text style={styles.payoutText}>Request Payout via MiCash</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>All-time earnings</Text>
          <Text style={styles.totalValue}>PGK {wallet?.total_earnings_pgk.toFixed(2) ?? "0.00"}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Payouts</Text>
      {wallet?.recent_payouts.map((p) => (
        <View key={p.id} style={styles.payoutItem}>
          <View>
            <Text style={styles.payoutMethod}>{p.method.toUpperCase()}</Text>
            <Text style={styles.payoutDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.payoutAmount}>PGK {p.amount_pgk.toFixed(2)}</Text>
            <Text style={[styles.payoutStatus, p.status === "completed" ? styles.statusDone : styles.statusPending]}>
              {p.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F2347", paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 24 },
  card: { backgroundColor: "#1a3a6b", borderRadius: 16, padding: 24, marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 1, marginBottom: 8 },
  balance: { fontSize: 40, fontWeight: "800", color: "#F59E0B", marginBottom: 20 },
  payoutButton: { backgroundColor: "#F59E0B", borderRadius: 10, padding: 14, alignItems: "center" },
  payoutDisabled: { opacity: 0.5 },
  payoutText: { color: "#0F2347", fontWeight: "700", fontSize: 15 },
  totalCard: { backgroundColor: "#1a3a6b", borderRadius: 12, padding: 16, marginBottom: 24 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, color: "#94a3b8" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#94a3b8", marginBottom: 12 },
  payoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a3a6b",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  payoutMethod: { fontSize: 14, fontWeight: "700", color: "#fff" },
  payoutDate: { fontSize: 12, color: "#64748b", marginTop: 2 },
  payoutAmount: { fontSize: 16, fontWeight: "700", color: "#F59E0B" },
  payoutStatus: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  statusDone: { color: "#22c55e" },
  statusPending: { color: "#F59E0B" },
});
