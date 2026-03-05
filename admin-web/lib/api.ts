/**
 * Admin API client — authenticates via JWT stored in cookies.
 * All responses use server-rendered tokens from httpOnly cookies.
 */
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const adminApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send httpOnly cookie
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Analytics
export const analyticsApi = {
  getDashboard: () => adminApi.get("/analytics/dashboard/").then((r) => r.data),
  getRevenue: (from?: string, to?: string) =>
    adminApi.get("/analytics/revenue/", { params: { from, to } }).then((r) => r.data),
};

// Trips
export const tripsApi = {
  list: (params?: Record<string, unknown>) =>
    adminApi.get("/trips/history/passenger/", { params }).then((r) => r.data),
};

// Users
export const usersApi = {
  me: () => adminApi.get("/users/me/").then((r) => r.data),
};
