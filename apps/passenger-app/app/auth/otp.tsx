/**
 * OTP verification screen — 6-digit code entry.
 */
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authService } from "../../services/auth";
import { useAuthStore } from "../../stores/authStore";

export default function OTPScreen() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const result = await authService.verifyOTP(phone, otp);
      setUser(result.user as any);
      setAuthenticated(true);
      router.replace("/tabs");
    } catch (error: any) {
      Alert.alert("Verification Failed", error?.response?.data?.detail ?? "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authService.sendOTP(phone);
      setCountdown(60);
      Alert.alert("Code Sent", "A new code has been sent to your number.");
    } catch {
      Alert.alert("Error", "Failed to resend code.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{"\n"}
        <Text style={styles.phone}>{phone}</Text>
      </Text>

      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        placeholder="------"
        placeholderTextColor="#ccc"
        textAlign="center"
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
        <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 60 },
  back: { marginBottom: 32 },
  backText: { fontSize: 16, color: "#1B4FFF" },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 32, lineHeight: 22 },
  phone: { fontWeight: "700", color: "#111" },
  input: {
    borderWidth: 1.5,
    borderColor: "#1B4FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    color: "#111",
    marginBottom: 24,
    letterSpacing: 12,
  },
  button: {
    backgroundColor: "#1B4FFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resend: { textAlign: "center", fontSize: 15, color: "#1B4FFF", fontWeight: "600" },
  resendDisabled: { color: "#999" },
});
