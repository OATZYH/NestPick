/**
 * Utilities for extracting and validating geographic coordinates from
 * various text formats including Google Maps URLs and raw coordinate strings.
 */

export interface ParsedCoordinates {
  lat: number;
  lng: number;
  sourceType: "google-maps-url" | "raw-coordinates";
  label?: string;
}

/**
 * Validates whether latitude and longitude are physically valid.
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Parses coordinates from Google Maps URLs or raw coordinate strings.
 * Supports:
 * - Desktop/Mobile URLs with `@lat,lng`: https://www.google.com/maps/place/.../@13.7554,100.5658,17z
 * - Search query URLs: https://www.google.com/maps/search/?api=1&query=13.7554,100.5658
 * - Query param URLs: https://maps.google.com/?q=13.7554,100.5658
 * - Query ll param: ?ll=13.7554,100.5658
 * - Raw coordinate string: "13.7554, 100.5658" or "13.7554, 100.5658" or "13.7554 100.5658"
 */
export function parseLocationInput(input: string): ParsedCoordinates | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // 1. Check for raw coordinates: "13.7554, 100.5658" or "13.7554 100.5658"
  // Allows optional +/- signs and up to 10 decimal digits
  const rawCoordsRegex = /^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/;
  const rawMatch = trimmed.match(rawCoordsRegex);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { lat, lng, sourceType: "raw-coordinates" };
    }
  }

  // 2. Google Maps URL patterns
  if (trimmed.includes("google.com/maps") || trimmed.includes("maps.google.com")) {
    // Pattern A: /@lat,lng,
    const atRegex = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/;
    const atMatch = trimmed.match(atRegex);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng, sourceType: "google-maps-url" };
      }
    }

    // Pattern B: q=lat,lng or query=lat,lng
    const queryRegex = /[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/;
    const queryMatch = trimmed.match(queryRegex);
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1]);
      const lng = parseFloat(queryMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng, sourceType: "google-maps-url" };
      }
    }

    // Pattern C: /place/.../!3dlat!4dlng (Google Maps internal place URL)
    const placeRegex = /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/;
    const placeMatch = trimmed.match(placeRegex);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng, sourceType: "google-maps-url" };
      }
    }
  }

  return null;
}

/**
 * Checks whether a string looks like a Google Maps shortened URL (maps.app.goo.gl or goo.gl/maps)
 */
export function isGoogleMapsShortLink(input: string): boolean {
  if (!input) return false;
  return /maps\.app\.goo\.gl\/|goo\.gl\/maps\//i.test(input.trim());
}
