/**Service functions for trip API calls."""
import type { Trip, TripRequest, FareEstimate, NearbyDriver } from "@hyryder/shared-types";
import apiClient from "./api";

export const tripsService = {
  requestTrip: async (data: TripRequest): Promise<Trip> => {
    const response = await apiClient.post<Trip>("/trips/request/", data);
    return response.data;
  },

  getTrip: async (tripId: number): Promise<Trip> => {
    const response = await apiClient.get<Trip>(`/trips/${tripId}/`);
    return response.data;
  },

  cancelTrip: async (tripId: number, note?: string): Promise<Trip> => {
    const response = await apiClient.post<Trip>(`/trips/${tripId}/cancel/`, { note });
    return response.data;
  },

  getHistory: async (): Promise<Trip[]> => {
    const response = await apiClient.get<{ results: Trip[] }>("/trips/history/passenger/");
    return response.data.results;
  },

  estimateFare: async (params: {
    category: string;
    distance_km: number;
    duration_minutes: number;
  }): Promise<FareEstimate> => {
    const response = await apiClient.get<FareEstimate>("/pricing/estimate/", { params });
    return response.data;
  },

  getNearbyDrivers: async (lat: number, lng: number): Promise<NearbyDriver[]> => {
    const response = await apiClient.get<NearbyDriver[]>("/location/nearby-drivers/", {
      params: { lat, lng, radius_km: 5 },
    });
    return response.data;
  },

  triggerSOS: async (tripId: number, lat: number, lng: number): Promise<void> => {
    await apiClient.post(`/trips/${tripId}/sos/`, { lat, lng });
  },
};
