/**Profile tab screen."""
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user?.first_name?.[0] ?? "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name ?? "---"}</Text>
        <Text style={styles.phone}>{user?.phone_number ?? "---"}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>★ {user?.rating ?? "5.00"}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.total_trips ?? 0}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1B4FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 4 },
  phone: { fontSize: 14, color: "#666", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 40 },
  stat: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#999", marginTop: 2 },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
});
