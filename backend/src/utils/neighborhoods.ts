// Pure, dependency-free NYC neighborhood lookup. Ported verbatim from the
// frontend (frontend/lib/neighborhoods.ts) so the label is computed once,
// server-side, at post-creation and stored on the row.
//
// Approximate center coordinates only (privacy rule: coarse location,
// never exact coordinates, surfaced to users).

export type NeighborhoodCenter = {
  name: string
  lat: number
  lng: number
}

export const NEIGHBORHOODS: NeighborhoodCenter[] = [
  { name: 'Flatbush', lat: 40.6526, lng: -73.9597 },
  { name: 'Long Island City', lat: 40.7447, lng: -73.9485 },
  { name: 'Staten Island', lat: 40.5795, lng: -74.1502 },
  { name: 'Midtown', lat: 40.7549, lng: -73.984 },
]

export const FALLBACK_NEIGHBORHOOD = 'NYC'

// Beyond this distance from every known center, fall back to "NYC" rather
// than naming the nearest (but implausibly far) neighborhood.
const MAX_DISTANCE_MILES = 30

const EARTH_RADIUS_MILES = 3958.8

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

// Returns the name of the nearest neighborhood center to (lat, lng), or
// "NYC" if no coordinates are given or the nearest center is implausibly far.
export function getNeighborhood(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return FALLBACK_NEIGHBORHOOD

  let nearest = FALLBACK_NEIGHBORHOOD
  let nearestDistance = Infinity

  for (const n of NEIGHBORHOODS) {
    const distance = haversineMiles(lat, lng, n.lat, n.lng)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = n.name
    }
  }

  return nearestDistance <= MAX_DISTANCE_MILES ? nearest : FALLBACK_NEIGHBORHOOD
}
