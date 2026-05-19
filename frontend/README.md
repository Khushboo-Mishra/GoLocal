# GoLocal — Frontend

React Native + Expo app for iOS and Android. One codebase, both platforms.

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo ~54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based, typed routes enabled) |
| Auth | Clerk (`@clerk/clerk-expo`) — installed, **wiring deferred** (see notes) |
| State | Zustand |
| Data fetching | TanStack Query |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Maps | react-native-maps |
| Feed list | @shopify/flash-list |
| Bottom sheets | @gorhom/bottom-sheet |
| HTTP | axios |
| Fonts | Instrument Serif + Sora (via @expo-google-fonts) |

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

There's no `frontend/.env.example` checked in yet. The app currently reads:

- `EXPO_PUBLIC_API_URL` — backend base URL (defaults to `http://localhost:3000`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — only used once Clerk is re-enabled (see below)

Create `frontend/.env` with whatever values you have. Expo only exposes variables prefixed with `EXPO_PUBLIC_` to client code.

### 4. Start the dev server
```bash
pnpm dev:frontend       # from repo root
# or, from this folder:
pnpm start
```

Scan the QR code with Expo Go on your phone.

For iOS simulator: press `i`
For Android emulator: press `a`

## Project structure

The actual layout (no `src/` wrapper):

```
frontend/
├── app/                       # Expo Router routes (file = route)
│   ├── _layout.tsx            # Root layout: fonts, QueryClient, theme, sheets
│   ├── +not-found.tsx
│   └── (app)/                 # Main route group
│       ├── _layout.tsx        # Tab/stack layout
│       ├── index.tsx          # Feed
│       ├── rooms.tsx          # Rooms list
│       ├── profile.tsx        # Profile
│       └── settings.tsx       # Settings
├── components/
│   ├── cards/                 # Post card variants
│   │   ├── PostCard.tsx
│   │   ├── ImageCard.tsx
│   │   ├── TextCard.tsx
│   │   ├── EventCard.tsx
│   │   ├── LocalSpotCard.tsx
│   │   ├── RoomCard.tsx
│   │   └── shared/            # Avatar, ActionRow, DistanceLabel
│   ├── feed/                  # FilterPills, Scrubber, RadarEnd, WalkMarker
│   ├── nav/                   # RadialNav
│   ├── sheets/                # CommentSheet + provider
│   └── ui/                    # Pressable, Text
├── services/
│   ├── api/client.ts          # axios instance + typed API calls
│   ├── stores/authStore.ts    # Zustand store for auth state
│   └── fixtures/              # feed.ts, comments.ts — dev stand-in data
├── hooks/
│   └── usePersistedState.ts
├── theme/                     # ThemeProvider, tokens, useTheme
├── constants/Layout.ts
├── types/index.ts
├── assets/                    # icons, splash, fonts
├── design/                    # Mockups (reference)
├── app.json                   # Expo config
├── eas.json                   # EAS Build config
└── package.json
```

## Current status (V1 launch plan)

What ships today:
- Expo Router shell with `(app)` group: Feed, Rooms, Profile, Settings screens scaffolded
- Theme system + custom fonts (Instrument Serif, Sora)
- Post card components + comment sheet provider
- `services/api/client.ts` axios wrapper with typed `feedApi` / `postsApi` calls
- Zustand auth store
- Fixture data under `services/fixtures/` so screens render without a live backend

Known gaps vs. the launch plan:
- **Auth is stubbed.** `ClerkProvider` is commented out in `app/_layout.tsx`, and the API client's auth interceptor is a no-op. Re-enable once the backend's Clerk integration is verified end-to-end.
- **No `(auth)` route group yet** — sign-in, name/photo, radius picker screens still to build (Phase 2 Week 4 in the plan).
- **No `create.tsx`** — post creation flow still to build (Phase 2 Week 6).
- **No `map.tsx`** — map view still to build (Phase 2 Week 6–7).
- **No `frontend/.env.example`** — add when Clerk is wired back up.
- **No `useFeed` / `useLocation` / `usePushToken` hooks** — feed currently renders from fixtures, not from `feedApi`.

## Adding a new screen

Expo Router is file-based and `typedRoutes` is on (`app.json` → `experiments.typedRoutes: true`). To add `app/(app)/explore.tsx`:
1. Create the file at `app/(app)/explore.tsx`
2. Export a default React component
3. Link to it with `<Link href="/(app)/explore" />`

## Building for app stores

EAS is configured (`eas.json` exists) but no `build:*` / `submit:*` scripts have been added to `package.json` yet. Run EAS directly:

```bash
npm i -g eas-cli
eas login

# Update the placeholder in app.json → extra.eas.projectId first
eas build --platform ios
eas build --platform android

# After build completes
eas submit --platform ios
eas submit --platform android
```

See `eas.json` for build profiles.

## Common issues

**Expo Go can't connect to local API** → Use your machine's local IP instead of `localhost` (e.g., `EXPO_PUBLIC_API_URL=http://192.168.1.x:3000`). Run `ifconfig` to find it.

**Maps blank on Android** → Add your Google Maps API key to `app.json` under `android.config.googleMaps.apiKey`.

**Clerk sign-in not working** → Expected for now. ClerkProvider is intentionally commented out in `app/_layout.tsx` until backend auth flow is tested.
