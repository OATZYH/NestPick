export type PropertyType = "condo" | "apartment" | "dorm" | "house";

export type PipelineStatus =
  | "interested"
  | "viewing_scheduled"
  | "viewed"
  | "negotiating"
  | "decided"
  | "rejected";

export type CenterPointCategory = "workplace" | "university" | "transit" | "landmark";

export interface Amenities {
  elevator: boolean;
  gym: boolean;
  pool: boolean;
  parking: boolean;
  cctv: boolean;
  keycard: boolean;
}

export interface PriceHistory {
  id: string;
  listing_id: string;
  rent: number;
  deposit: number;
  advance: number;
  common_fee: number;
  parking_fee: number;
  internet_fee: number;
  water_type: "flat" | "metered";
  water_rate: string;
  electric_type: "metered" | "government" | "flat";
  electric_rate: string;
  recorded_at: string;
  note?: string;
}

export interface Contract {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  deposit_refund_terms: string;
  pet_allowed: boolean;
  smoking_allowed: boolean;
  guest_allowed: boolean;
  early_termination_penalty: string;
  contract_file_url?: string;
}

export interface ViewingLog {
  id: string;
  listing_id: string;
  scheduled_at: string;
  notes: string;
  rating: number; // 1-5
  completed?: boolean;
}

export interface Listing {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: PropertyType;
  size_sqm: number;
  floor: number;
  view: string;
  source_url: string;
  contact_phone: string;
  contact_line: string;
  status: PipelineStatus;
  is_favorite: boolean;
  created_at: string;
  notes: string;
  amenities: Amenities;
  photos: string[];
  price_history: PriceHistory[];
  contract?: Contract;
  viewing_logs: ViewingLog[];
}

export interface CenterPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: CenterPointCategory;
  icon?: string;
  color?: string;
}

export interface PropertyTypeConfig {
  id: PropertyType;
  name: string;
  icon: string;
  color: string;
}

export interface PipelineStatusConfig {
  id: PipelineStatus;
  name: string;
  color: string;
  badgeClass: string;
}
