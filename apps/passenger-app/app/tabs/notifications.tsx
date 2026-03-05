/**Notifications tab screen."""
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../services/api";
import type { AppNotification } from "@hyryder/shared-types";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/");
      return res.data.results ?? res.data;
    },
  });

  const markRead = useMutation({
    mutationFn: () => apiClient.post("/notifications/read-all/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => markRead.mutate()}>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.is_read && styles.itemUnread]}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
            <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  markRead: { fontSize: 14, color: "#1B4FFF", fontWeight: "600" },
  item: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8 },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: "#1B4FFF" },
  itemTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 4 },
  itemBody: { fontSize: 14, color: "#444", lineHeight: 20, marginBottom: 6 },
  itemTime: { fontSize: 12, color: "#999" },
  empty: { textAlign: "center", color: "#999", marginTop: 60, fontSize: 16 },
});
