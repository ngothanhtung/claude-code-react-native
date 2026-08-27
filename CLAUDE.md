# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo version notice

This project uses **Expo SDK 57**, a recent major version with breaking changes from earlier SDKs. Before writing or editing any Expo-related code (including `expo-router`, `expo-font`, `expo-splash-screen`, `expo-symbols`, etc.), read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ — do not rely on older Expo knowledge, since APIs, config fields, and conventions have changed.

## Commands

```bash
npm run start    # Start the Expo dev server (Metro)
npm run ios      # Start and open in iOS simulator
npm run android  # Start and open in Android emulator
npm run web      # Start and open in web browser
```

There is no configured lint, test, or typecheck script in package.json. To typecheck manually, run `npx tsc --noEmit`.

## Architecture

This is an Expo Router (file-based routing) app named "taskflow".

- **Routing**: `app/` is the route root. `app/_layout.tsx` is the root layout — it loads fonts, controls the splash screen, and wraps everything in a `ThemeProvider` (light/dark) before rendering a `Stack`. `app/(tabs)/` is a route group containing the tab navigator (`_layout.tsx` defines `Tabs.Screen` entries for `index` and `two`). `app/modal.tsx` is presented as a modal from the root stack. `app/+html.tsx` and `app/+not-found.tsx` are Expo Router special files (web HTML shell and 404 fallback, respectively).
- **App launch flow (onboarding → login → tabs)**: `RootLayoutNav` in `app/_layout.tsx` checks `AsyncStorage` for the `hasCompletedOnboarding` key (exported as `ONBOARDING_STORAGE_KEY` from `app/onboarding.tsx`) on mount and calls `router.replace` to `/login` (if the key is `'true'`) or `/onboarding` (otherwise) — this redirect always fires after the `(tabs)` initial route mounts, so `(tabs)` briefly flashes before redirecting. `app/onboarding.tsx` is a 3-slide swiper (built with a plain horizontal `ScrollView`, not a third-party carousel lib) that sets the storage key and routes to `/login` when finished or skipped. `app/login.tsx` is a static/mock auth screen — there is no real backend; credentials are hardcoded (`admin@claude.ai` / `123456789`) and a successful match calls `router.replace('/(tabs)')`. There is no persisted login session, so every cold start of the app returns to `/login` (only the onboarding-seen flag persists).
- **Theming**: `components/Themed.tsx` exports theme-aware `Text` and `View` components plus a `useThemeColor` hook; these read from `constants/Colors.ts` (light/dark palettes) and `components/useColorScheme.ts`. Prefer these over importing `Text`/`View` directly from `react-native` when a component needs to respect light/dark mode. Note: `app/onboarding.tsx` and `app/login.tsx` are branded/static screens and intentionally use hardcoded light-mode colors instead of the Themed components.
- **Fonts**: Loaded once via `useFonts` in `app/_layout.tsx`. Custom families in use: `SpaceMono` (local file, `assets/fonts/SpaceMono-Regular.ttf`) and the Be Vietnam Pro set — `BeVietnamPro_400Regular` / `BeVietnamPro_500Medium` / `BeVietnamPro_600SemiBold` / `BeVietnamPro_700Bold` from `@expo-google-fonts/be-vietnam-pro` — used on the onboarding, login, and signup screens (and `components/SaveMeToggle.tsx`). Reference by exact family-name string in `fontFamily`, not `fontWeight` (each weight is a separate registered family, not a single variable font).
- **Platform-specific files**: `useClientOnlyValue.ts` / `.web.ts` and `useColorScheme.ts` / `.web.ts` use Expo/Metro's platform extension resolution (`.web.ts` overrides the default on web builds) — edit both when changing behavior that differs by platform.
- **Path aliasing**: `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/components/Themed`, `@/constants/Colors`.
- **Typed routes**: `experiments.typedRoutes` is enabled in `app.json`, so route names used with `Link`/`router.push` are type-checked against files under `app/`.

## Gotchas

- `Dimensions.get('window')` can return a stale width on web (captured before the real viewport size is known), breaking width-dependent layouts like paged `ScrollView`s. Use the `useWindowDimensions` hook instead for anything that needs the live viewport width (see `app/onboarding.tsx`).
- For a paged horizontal `ScrollView` driven by a "Next" button (not just swipe gestures), don't rely solely on `onMomentumScrollEnd` to update the current-page index — it doesn't fire reliably for every `scrollTo` call (especially on web). Update the index state optimistically when the button is pressed.
