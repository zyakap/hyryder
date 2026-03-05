/**Zustand store for driver-specific state."""
import { create } from "zustand";
import type { Trip } from "@hyryder/shared-types";

interface DriverState {
  isOnline: boolean;
  activeTrip: Trip | null;
  walletBalanceToea: number;
  totalEarningsToea: number;
  setOnline: (online: boolean) => void;
  setActiveTrip: (trip: Trip | null) => void;
  setWallet: (balance: number, total: number) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  isOnline: false,
  activeTrip: null,
  walletBalanceToea: 0,
  totalEarningsToea: 0,
  setOnline: (online) => set({ isOnline: online }),
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setWallet: (balance, total) => set({ walletBalanceToea: balance, totalEarningsToea: total }),
}));
