/**
 * Geographic utilities for service-area matching.
 *
 * Haversine formula gives exact great-circle distance from stored lat/lng.
 * estimateLatLng derives approximate coordinates from Australian postcodes so
 * that records without GPS data can still participate in radius matching.
 */

/** Great-circle distance in km between two WGS-84 coordinates. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth mean radius (km)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Derive approximate WGS-84 coordinates from an Australian postcode.
 *
 * Each state band maps postcodes linearly onto a lat/lng spread centred on
 * the state capital.  Within a band a deterministic jitter (based on
 * postcode modulo small primes) differentiates nearby postcodes while
 * keeping the estimate stable across calls for the same postcode.
 *
 * Accuracy is ±5–20 km — sufficient for "within N km" service-area queries
 * but not for navigation.  Returns null for unrecognised postcodes.
 */
export function estimateLatLng(
  postcode: string | null | undefined
): { lat: number; lng: number } | null {
  if (!postcode) return null;
  const pc = parseInt(postcode, 10);
  if (isNaN(pc)) return null;

  // ACT sub-ranges listed before NSW to avoid NSW catch-all swallowing them.
  const BANDS: Array<{
    min: number;
    max: number;
    lat: number;
    lng: number;
    spread: number;
  }> = [
    // ACT
    { min: 2600, max: 2618, lat: -35.282, lng: 149.129, spread: 0.12 },
    { min: 2900, max: 2920, lat: -35.340, lng: 149.180, spread: 0.10 },
    // NSW (Sydney metro + regions)
    { min: 1000, max: 2599, lat: -33.868, lng: 151.209, spread: 3.8 },
    { min: 2619, max: 2899, lat: -33.750, lng: 150.850, spread: 2.5 },
    { min: 2921, max: 2999, lat: -33.400, lng: 151.000, spread: 1.0 },
    // VIC
    { min: 3000, max: 3999, lat: -37.814, lng: 144.963, spread: 4.0 },
    // QLD
    { min: 4000, max: 4999, lat: -27.470, lng: 153.025, spread: 8.0 },
    // SA
    { min: 5000, max: 5799, lat: -34.929, lng: 138.601, spread: 3.5 },
    // WA
    { min: 6000, max: 6797, lat: -31.951, lng: 115.861, spread: 5.0 },
    // TAS
    { min: 7000, max: 7999, lat: -42.882, lng: 147.327, spread: 2.5 },
    // NT
    { min: 800, max: 999, lat: -12.463, lng: 130.846, spread: 4.0 },
  ];

  const band = BANDS.find((b) => pc >= b.min && pc <= b.max);
  if (!band) return null;

  const range = band.max - band.min || 1;
  const ratio = (pc - band.min) / range; // 0..1 along the band

  // Deterministic sub-band jitter to separate postcodes (not random)
  const jLat = ((pc % 31) / 31 - 0.5) * band.spread * 0.18;
  const jLng = ((pc % 17) / 17 - 0.5) * band.spread * 0.12;

  return {
    lat: band.lat + (ratio - 0.5) * band.spread + jLat,
    lng: band.lng + (ratio - 0.5) * band.spread * 0.6 + jLng,
  };
}
