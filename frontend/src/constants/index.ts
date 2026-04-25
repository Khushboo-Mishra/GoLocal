// App-wide constants

export const COLORS = {
  primary: '#FF4D1C',     // GoLocal orange
  dark: '#0D0D0D',        // Background
  card: '#1A1A1A',        // Card background
  surface: '#242424',     // Input / surface
  text: '#FFFFFF',
  textSecondary: '#9E9E9E',
  textTertiary: '#616161',
  border: '#2E2E2E',

  // Post type colors
  event: '#534AB7',       // Purple
  hangout: '#0F6E56',     // Teal
  deal: '#854F0B',        // Amber
} as const

export const FONTS = {
  regular: 'System',
  bold: 'System',
} as const

export const RADIUS_OPTIONS = [
  { label: 'Under 1 mile', value: 1 },
  { label: 'Up to 3 miles', value: 3 },
  { label: 'Up to 5 miles', value: 5 },
] as const

export const POST_TYPES = [
  { label: 'Event', value: 'event', color: COLORS.event, icon: 'calendar' },
  { label: 'Hangout', value: 'hangout', color: COLORS.hangout, icon: 'people' },
  { label: 'Deal', value: 'deal', color: COLORS.deal, icon: 'tag' },
] as const

export const REPORT_REASONS = [
  { label: 'Spam', value: 'spam' },
  { label: 'Fake or misleading', value: 'fake' },
  { label: 'Inappropriate content', value: 'inappropriate' },
  { label: 'Safety concern', value: 'safety' },
  { label: 'Other', value: 'other' },
] as const

// Max media sizes
export const MAX_IMAGE_SIZE_MB = 10
export const MAX_VIDEO_SIZE_MB = 50
export const MAX_VIDEO_DURATION_SECONDS = 60

// Feed
export const FEED_PAGE_SIZE = 20
export const FEED_CACHE_TTL_MS = 60_000  // 1 minute
