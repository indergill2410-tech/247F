/**
 * Geographic utilities for service-area matching.
 *
 * `haversineKm` — exact great-circle distance from stored lat/lng.
 * `lookupCoords` — canonical suburb-level lookup from the bundled AU dataset;
 *   falls back to postcode-only match within the same dataset.
 *   Returns null when the suburb+postcode pair is not in the dataset.
 */

import { lookupSuburbCoords } from "../data/au-suburb-coords.js";

export { lookupSuburbCoords };

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
