/**
 * Phone number entry screen — first step of OTP auth.
 */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../services/auth";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("+675");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone.match(/^\+675[0-9]{7,8}$/)) {
      Alert.alert("Invalid Number", "Please enter a valid PNG phone number starting with +675");
      return;
    }
    setLoading(true);
    try {
      await authService.sendOTP(phone);
      router.push({ pathname: "/auth/otp", params: { phone } });
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.detail ?? "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>HyRyder</Text>
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>
          We'll send a 6-digit code to verify your number
        </Text>

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+675 7123 456"
          placeholderTextColor="#999"
          maxLength={13}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Sending..." : "Continue"}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  logo: { fontSize: 32, fontWeight: "800", color: "#1B4FFF", marginBottom: 48 },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 32, lineHeight: 22 },
  input: {
    borderWidth: 1.5,
    borderColor: "#1B4FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#111",
    marginBottom: 24,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#1B4FFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  terms: { marginTop: 24, fontSize: 12, color: "#999", textAlign: "center", lineHeight: 18 },
});
