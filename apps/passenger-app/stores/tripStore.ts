/**
 * Zustand trip store — active trip state, driver location updates.
 */
import { create } from "zustand";
import type { Trip, NearbyDriver, LatLng } from "@hyryder/shared-types";

interface TripState {
  activeTrip: Trip | null;
  nearbyDrivers: NearbyDriver[];
  driverLocation: LatLng | null;
  driverHeading: number;
  pickupLocation: LatLng | null;
  dropoffLocation: LatLng | null;
  pickupAddress: string;
  dropoffAddress: string;
  setActiveTrip: (trip: Trip | null) => void;
  setNearbyDrivers: (drivers: NearbyDriver[]) => void;
  updateDriverLocation: (lat: number, lng: number, heading: number) => void;
  setPickup: (location: LatLng, address: string) => void;
  setDropoff: (location: LatLng, address: string) => void;
  clearBooking: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  nearbyDrivers: [],
  driverLocation: null,
  driverHeading: 0,
  pickupLocation: null,
  dropoffLocation: null,
  pickupAddress: "",
  dropoffAddress: "",

  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),
  updateDriverLocation: (lat, lng, heading) =>
    set({ driverLocation: { lat, lng }, driverHeading: heading }),
  setPickup: (location, address) =>
    set({ pickupLocation: location, pickupAddress: address }),
  setDropoff: (location, address) =>
    set({ dropoffLocation: location, dropoffAddress: address }),
  clearBooking: () =>
    set({
      activeTrip: null,
      driverLocation: null,
      pickupLocation: null,
      dropoffLocation: null,
      pickupAddress: "",
      dropoffAddress: "",
    }),
}));
