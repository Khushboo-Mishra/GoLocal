# GoLocal — Frontend

React Native + Expo app for iOS and Android. One codebase, both platforms.

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.76 + Expo ~52 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Auth | Clerk (`@clerk/clerk-expo`) |
| State | Zustand |
| Data fetching | TanStack Query |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Maps | react-native-maps |
| Feed list | @shopify/flash-list |
| Bottom sheets | @gorhom/bottom-sheet |
| HTTP | axios |

## Local setup

### 1. Prerequisites
- Node.js v20+
- pnpm v9+
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Install dependencies
```bash
# From repo root
pnpm install
```

### 3. Environment variables
```bash
cp .env.example .env
```
Required:
- `EXPO_PUBLIC_API_URL` — point to `http://localhost:3000` for local dev
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard

### 4. Start the dev server
```bash
pnpm dev:frontend
# or from this folder:
pnpm start
```

Scan the QR code with Expo Go on your phone.

For iOS simulator: press `i`
For Android emulator: press `a`

## Project structure

```
frontend/
├── src/
│   ├── app/                  # Expo Router screens (file = route)
│   │   ├── _layout.tsx       # Root layout (providers)
│   │   ├── (auth)/           # Auth route group
│   │   │   ├── sign-in.tsx   # Phone + Google sign-in
│   │   │   └── onboarding/   # Name, photo, radius setup
│   │   └── (app)/            # Main app route group
│   │       ├── _layout.tsx   # Tab bar layout
│   │       ├── index.tsx     # Feed screen (Nearby / Trending / Going)
│   │       ├── create.tsx    # Post creation
│   │       ├── map.tsx       # Map view
│   │       └── profile/      # Profile + settings
│   ├── components/
│   │   ├── FeedCard.tsx      # Full-screen post card (TODO)
│   │   ├── PostTypeBadge.tsx # Event / Hangout / Deal pill (TODO)
│   │   ├── DistanceBadge.tsx # "0.4 mi" badge (TODO)
│   │   └── ...               # Add components here
│   ├── api/
│   │   └── client.ts         # Axios instance + all API calls
│   ├── hooks/
│   │   ├── useFeed.ts        # TanStack Query feed hooks (TODO)
│   │   ├── useLocation.ts    # GPS location hook (TODO)
│   │   └── usePushToken.ts   # Expo push token (TODO)
│   ├── stores/
│   │   └── authStore.ts      # Zustand — current user state
│   ├── types/
│   │   └── index.ts          # All TypeScript types
│   └── constants/
│       └── index.ts          # Colors, post types, limits
├── assets/                   # Icons, splash, images
├── app.json                  # Expo config
├── eas.json                  # EAS Build config
├── package.json
└── .env.example
```

## Screen build order

Build screens in this order (from the Week plan in [docs](../docs/)):

1. **Onboarding** — sign-in → name/photo → radius picker
2. **Feed** — swipeable cards, tabs, infinite scroll
3. **Create post** — media picker, form, upload
4. **Map** — pins, clusters, bottom sheet preview
5. **Profile** — posts grid, saved grid, settings

## Adding a new screen

Expo Router is file-based. To add `app/(app)/explore.tsx`:
1. Create the file at `src/app/(app)/explore.tsx`
2. Export a default React component
3. Link to it with `<Link href="/(app)/explore" />`

## Building for app stores

```bash
# Install EAS CLI (one time)
npm i -g eas-cli
eas login

# Build for both platforms
pnpm build:ios
pnpm build:android

# Submit to stores (after build completes)
pnpm submit:ios
pnpm submit:android
```

See `eas.json` for build profiles.

## Environment variables

Expo only exposes variables prefixed with `EXPO_PUBLIC_` to client code.

**Never put secret keys here** — all secrets live in the backend.

## Common issues

**Expo Go can't connect to local API** → Use your machine's local IP instead of `localhost` (e.g., `http://192.168.1.x:3000`). Run `ifconfig` to find it.

**Clerk sign-in doesn't redirect** → Check that the redirect URL in Clerk dashboard includes `golocal://` (the scheme from `app.json`).

**Maps blank on Android** → Add your Google Maps API key to `app.json` under `android.config.googleMaps.apiKey`.
