// utils/geo.ts — helpers for distance + coordinate validation.
// Heavy lifting is done by PostGIS in the DB; these helpers
// cover the things we need to do in app code (validation,
// cache-key rounding, unit conversion).

import { z } from 'zod'

export const METERS_PER_MILE = 1609.344

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE
}

// Round to 2 decimal places (~1km precision). Used for cache keys
// so two users 500m apart hit the same nearby feed cache slot.
export function roundCoord(n: number, precision = 2): number {
  const factor = 10 ** precision
  return Math.round(n * factor) / factor
}

// Strict zod schemas for lat/lng. Reject NaN, Infinity, and out-of-range.
export const latSchema = z
  .number()
  .finite()
  .min(-90, 'lat must be >= -90')
  .max(90, 'lat must be <= 90')

export const lngSchema = z
  .number()
  .finite()
  .min(-180, 'lng must be >= -180')
  .max(180, 'lng must be <= 180')

export const coordSchema = z.object({ lat: latSchema, lng: lngSchema })

// Haversine — fallback when we already have two points in JS and don't
// want a round trip to the DB. Returns miles. Not used in hot paths.
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8 // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}
