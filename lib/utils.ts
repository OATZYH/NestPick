import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates whether latitude and longitude are valid, finite geographic coordinates.
 * Latitude must be in range [-90, 90], Longitude in [-180, 180].
 * Rejects NaN, Infinity, and null-island (0, 0).
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  const numLat = typeof lat === "number" ? lat : Number(lat);
  const numLng = typeof lng === "number" ? lng : Number(lng);

  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
    return false;
  }
  if (numLat < -90 || numLat > 90) {
    return false;
  }
  if (numLng < -180 || numLng > 180) {
    return false;
  }
  // Reject 0, 0 as default uninitialized / null-island coordinates
  if (numLat === 0 && numLng === 0) {
    return false;
  }
  return true;
}
