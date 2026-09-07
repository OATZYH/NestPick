import { Listing as FrontendListing, PriceHistory as FrontendPriceHistory, Contract as FrontendContract, ViewingLog as FrontendViewingLog, CenterPoint as FrontendCenterPoint, Amenities } from "@/types/hunting";

function toNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
    return (val as { toNumber: () => number }).toNumber();
  }
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

function toIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return new Date(String(val)).toISOString();
}

function toDateOnlyString(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "string") return val.split("T")[0];
  return "";
}

export function serializePriceHistory(p: any): FrontendPriceHistory {
  return {
    id: p.id,
    listing_id: p.listing_id,
    rent: toNumber(p.rent),
    deposit: toNumber(p.deposit),
    advance: toNumber(p.advance),
    common_fee: toNumber(p.common_fee),
    parking_fee: toNumber(p.parking_fee),
    internet_fee: toNumber(p.internet_fee),
    water_type: p.water_type === "metered" ? "metered" : "flat",
    water_rate: p.water_rate ?? "",
    electric_type: p.electric_type === "metered" ? "metered" : p.electric_type === "government" ? "government" : "flat",
    electric_rate: p.electric_rate ?? "",
    recorded_at: toIsoString(p.recorded_at),
    note: p.note ?? undefined,
  };
}

export function serializeContract(c: any): FrontendContract {
  return {
    id: c.id,
    listing_id: c.listing_id,
    start_date: toDateOnlyString(c.start_date),
    end_date: toDateOnlyString(c.end_date),
    duration_months: Number(c.duration_months) || 12,
    deposit_refund_terms: c.deposit_refund_terms ?? "",
    pet_allowed: Boolean(c.pet_allowed),
    smoking_allowed: Boolean(c.smoking_allowed),
    guest_allowed: Boolean(c.guest_allowed),
    early_termination_penalty: c.early_termination_penalty ?? "",
    contract_file_url: c.contract_file_url ?? undefined,
  };
}

export function serializeViewingLog(v: any): FrontendViewingLog {
  return {
    id: v.id,
    listing_id: v.listing_id,
    scheduled_at: toIsoString(v.scheduled_at),
    notes: v.notes ?? "",
    rating: toNumber(v.rating, 0),
    completed: Boolean(v.completed),
  };
}

const defaultAmenities: Amenities = {
  elevator: false,
  gym: false,
  pool: false,
  parking: false,
  cctv: false,
  keycard: false,
};

export function serializeListing(row: any): FrontendListing {
  const rawAmenities = row.amenities;
  const amenities: Amenities = typeof rawAmenities === "object" && rawAmenities !== null
    ? { ...defaultAmenities, ...rawAmenities }
    : { ...defaultAmenities };

  return {
    id: row.id,
    name: row.name ?? "",
    address: row.address ?? "",
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    type: row.type,
    size_sqm: toNumber(row.size_sqm),
    floor: Number(row.floor) || 1,
    view: row.view ?? "",
    source_url: row.source_url ?? "",
    contact_phone: row.contact_phone ?? "",
    contact_line: row.contact_line ?? "",
    status: row.status,
    is_favorite: Boolean(row.is_favorite),
    created_at: toIsoString(row.created_at),
    notes: row.notes ?? "",
    amenities,
    photos: Array.isArray(row.photos) ? row.photos : [],
    price_history: Array.isArray(row.priceHistory)
      ? row.priceHistory.map(serializePriceHistory)
      : [],
    contract: row.contract ? serializeContract(row.contract) : undefined,
    viewing_logs: Array.isArray(row.viewingLogs)
      ? row.viewingLogs.map(serializeViewingLog)
      : [],
  };
}

export function serializeCenterPoint(row: any): FrontendCenterPoint {
  return {
    id: row.id,
    name: row.name,
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    category: row.category,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
  };
}
