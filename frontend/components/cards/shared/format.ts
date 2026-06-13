// Shared formatting helpers for post cards + feed entries.
// Distance rule: never show an exact distance under a mile.

export function formatDistanceLabel(distanceMiles?: number): string {
  if (distanceMiles == null) return 'Nearby';
  if (distanceMiles < 1) return 'Under a mile away';
  const rounded = Math.round(distanceMiles * 10) / 10;
  return `${rounded} miles away`;
}

// Used by WalkMarker — approximate walking time at ~20 min/mile.
export function formatWalkLabel(distanceMiles?: number): string {
  if (distanceMiles == null) return 'Nearby';
  if (distanceMiles < 0.05) return 'Right around here';
  const minutes = Math.max(1, Math.round(distanceMiles * 20));
  return `~${minutes} min walk`;
}

export type EventDate = { month: string; day: number; time: string };

export function formatEventDate(eventTime: string | null): EventDate | null {
  if (!eventTime) return null;
  const d = new Date(eventTime);
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}
