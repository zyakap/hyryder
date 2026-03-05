// ============================================================================
// HyRyder Shared TypeScript Types
// Shared across passenger app, driver app, and admin web dashboard
// ============================================================================

// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------
export type UserRole = "passenger" | "driver" | "admin" | "superadmin";

export interface User {
  id: number;
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_phone_verified: boolean;
  profile_photo: string | null;
  rating: string;
  total_trips: number;
  preferred_language: string;
  passenger_profile?: PassengerProfile;
  driver_profile?: DriverProfile;
  created_at: string;
  updated_at: string;
}

export interface PassengerProfile {
  home_address: string;
  work_address: string;
  promo_credits_toea: number;
}

export interface DriverProfile {
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  license_number: string;
  license_expiry: string | null;
  vehicle_registration: string;
  registration_expiry: string | null;
  wallet_balance_toea: number;
  total_earnings_toea: number;
  acceptance_rate: string;
  completion_rate: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  is_new_user: boolean;
  user: {
    id: number;
    phone_number: string;
    role: UserRole;
    is_phone_verified: boolean;
  };
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------
export type TripStatus =
  | "requested"
  | "driver_matched"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "micash" | "mpaisa" | "wallet";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Trip {
  id: number;
  passenger_name: string;
  driver_name: string | null;
  driver_phone: string | null;
  status: TripStatus;
  payment_method: PaymentMethod;
  is_paid: boolean;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_fare_toea: number;
  final_fare_toea: number;
  fare_pgk: number;
  surge_multiplier: string;
  platform_fee_toea: number;
  promo_discount_toea: number;
  distance_km: string | null;
  duration_seconds: number | null;
  requested_at: string;
  matched_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  sos_triggered: boolean;
}

export interface TripRequest {
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  payment_method: PaymentMethod;
  promo_code?: number;
}

export interface FareEstimate {
  base_fare_toea: number;
  distance_charge_toea: number;
  time_charge_toea: number;
  surge_multiplier: string;
  subtotal_toea: number;
  promo_discount_toea: number;
  final_fare_toea: number;
  platform_fee_toea: number;
  driver_earnings_toea: number;
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------
export type VehicleCategory = "standard" | "premium" | "xl";

export interface Vehicle {
  id: number;
  category: VehicleCategory;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  seats: number;
  is_active: boolean;
  is_verified: boolean;
  photo: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------
export interface NearbyDriver {
  driver_id: number;
  driver_name: string;
  driver_rating: string;
  lat: number;
  lng: number;
  heading: number;
  distance_km: number | null;
}

export interface DriverLocationUpdate {
  event: "driver_location";
  lat: number;
  lng: number;
  heading: number;
  speed_kmh: number;
}

export interface TripStatusUpdate {
  event: "trip_status";
  status: TripStatus;
  trip_id: number;
}

export type WebSocketMessage = DriverLocationUpdate | TripStatusUpdate;

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export interface DriverWallet {
  wallet_balance_toea: number;
  wallet_balance_pgk: number;
  total_earnings_toea: number;
  total_earnings_pgk: number;
  recent_payouts: DriverPayout[];
}

export interface DriverPayout {
  id: number;
  amount_toea: number;
  amount_pgk: number;
  method: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------
export interface SupportTicket {
  id: number;
  category: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: number;
  created_at: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  sender_name: string;
  message: string;
  attachment: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Analytics (Admin)
// ---------------------------------------------------------------------------
export interface DailySnapshot {
  date: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_revenue_pgk: number;
  avg_fare_pgk: number;
  active_drivers: number;
  new_passengers: number;
}

export interface RevenueSummary {
  total_revenue_pgk: number;
  total_trips: number;
  completed_trips: number;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
