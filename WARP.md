# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Expo (React Native + Web) app using Expo Router and Supabase.

Commands

- Install dependencies
  ```bash path=null start=null
  npm install
  ```
- Start development server (Metro)
  ```bash path=null start=null
  npm run start
  ```
- Platform targets
  ```bash path=null start=null
  npm run android
  npm run ios
  npm run web
  ```
- Lint
  ```bash path=null start=null
  npm run lint
  ```
- Typecheck (no script; uses tsconfig.json)
  ```bash path=null start=null
  npx tsc --noEmit
  ```
- Web static export (app.json sets web.output=static; output goes to dist/)
  ```bash path=null start=null
  npx expo export -p web
  ```
- Reset to a blank starter (moves current app into app-example/)
  ```bash path=null start=null
  npm run reset-project
  ```
- Tests
  - No test runner configured in package.json.

Environment

- Supabase client expects the following Expo public env vars (read at runtime):
  - EXPO_PUBLIC_SUPABASE_URL
  - EXPO_PUBLIC_SUPABASE_ANON_KEY
- Provide them via your shell when running commands or configure Expo env for your workflow. Example (replace placeholders):
  ```bash path=null start=null
  EXPO_PUBLIC_SUPABASE_URL={{SUPABASE_URL}} \
  EXPO_PUBLIC_SUPABASE_ANON_KEY={{SUPABASE_ANON_KEY}} \
  npm run start
  ```

High-level architecture

- Navigation and screens (Expo Router)
  - app/_layout.tsx defines the root Stack with registered screens (index, login, client-login, (tabs), and feature screens like QuickBookScreen, JoinGamesScreen, VenueDetailsScreen, etc.).
  - app/(tabs)/_layout.tsx defines a 4-tab bottom navigator (Home, Courts, Social, Profile) with static colors and a haptic tab button.
- Source layout (domain-oriented)
  - src/common: shared UI (common/components), theming (common/constants/theme.ts, constants/Colors.ts), types, and cross-cutting services.
    - common/services/supabase.ts initializes the Supabase JS client with AsyncStorage-backed auth.
    - common/services/appInit.ts centralizes app/session initialization and auth-state listening; exposes a subscribe/notify pattern for auth state.
    - common/services/venueStorage.ts provides in-memory venue CRUD and a public listing adapter.
    - common/utils/bookingStore.ts is a minimal observable store for bookings (add/get/subscribe).
  - src/user, src/client, src/admin: per-role entrypoints and services (e.g., userAuth, clientAuth, admin/client APIs).
  - styles/: theme and per-screen style modules used across screens.
- Configuration & tooling
  - TypeScript strict mode with path alias `@/*` to project root (tsconfig.json). Code commonly imports using `@/...`.
  - ESLint via eslint-config-expo; dist/ is ignored.
  - app.json configures expo-router (typedRoutes), splash screen, and web bundling with Metro and static export.
- Data model and backend
  - supabase-schema.sql declares tables (users, clients, venues, bookings) with RLS policies and timestamp triggers. SQL helper files in repo provide RLS fixes.

Key workflows for agents

- To debug authentication/session flows, start at `src/common/services/appInit.ts` (initialize, signOut, onAuthStateChange) and the role-specific auth services under `src/user/services` and `src/client/services`.
- To modify navigation, edit `app/_layout.tsx` (Stack) and `app/(tabs)/_layout.tsx` (Tabs). Screens are routed by their file paths.
- For data without backend wiring, `VenueStorageService` and `bookingStore` provide local, in-memory behavior suitable for prototyping.
