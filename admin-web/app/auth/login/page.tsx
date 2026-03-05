"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/otp/send/`, { phone_number: phone, role: "admin" });
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/otp/verify/`, { phone_number: phone, otp_code: otp, role: "admin" });
      localStorage.setItem("admin_access_token", res.data.access);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F2347] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="text-blue-400 w-8 h-8" />
          <span className="text-2xl font-bold text-white tracking-tight">HyRyder Admin</span>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {step === "phone" ? "Admin Login" : "Verify Code"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {step === "phone" ? "Enter your admin phone number." : `Code sent to ${phone}`}
          </p>
          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+675 7123 456"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="------"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button type="button" onClick={() => setStep("phone")} className="w-full text-gray-400 text-sm">
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
