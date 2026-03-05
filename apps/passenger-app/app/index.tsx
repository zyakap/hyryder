/**Entry point — redirect based on auth state."""
import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1B4FFF" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/tabs" : "/auth/phone"} />;
}
