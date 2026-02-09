# 7dollar POS App - AI Agent Instructions

## Project Overview

A React Native/Expo cross-platform POS (Point of Sale) application targeting iOS, Android, and web. Uses Expo Router for file-based routing and React Navigation for tab-based navigation.

## Architecture

### File-Based Routing (Expo Router)

- Located in `app/` directory following Expo Router conventions
- Root layout: `app/_layout.tsx` - configures theme provider and root navigation stack
- Tab navigation: `app/(tabs)/_layout.tsx` - defines bottom tab structure with two screens (index, explore)
- Platform-specific files use `.web.ts`/`.web.tsx` suffix (e.g., `use-color-scheme.web.ts`)

### Theme & Styling System

- **Theme constants**: `constants/theme.ts` exports `Colors` (light/dark modes) and `Fonts` (platform-specific)
- **Color scheme detection**: `hooks/use-color-scheme.ts` wraps React Native's `useColorScheme()`
  - Web variant (`use-color-scheme.web.ts`) includes hydration check to prevent SSR mismatches
- **Applied via**: React Navigation's `ThemeProvider` with `DarkTheme`/`DefaultTheme`

### Multi-Platform Support

- **iOS**: Built via `npx expo start --ios`; adaptive icons in `assets/images/`
- **Android**: Supports edge-to-edge (predictive back gesture disabled)
- **Web**: Static output mode; requires client-side color scheme detection for hydration
- **New Arch**: Enabled (`newArchEnabled: true`) for Fabric/TurboModules support

## Key Commands

```bash
npm start              # Start dev server (choose platform interactively)
npx expo start --ios   # iOS development
npx expo start --android  # Android development
npx expo start --web   # Web (static output)
npm run lint           # ESLint with expo config
npm run reset-project  # Move starter to app-example/, create blank app/
```

## Development Patterns

### Component Structure

- **Layout files**: Use `_layout.tsx` (RootLayout, TabLayout) to configure navigation and theme
- **Screen files**: Page components in `app/(tabs)/` - currently minimal shells, ready for feature development
- **Hooks directory**: Custom hooks for cross-platform concerns (color scheme detection)
- **Components directory**: Empty; create reusable UI components here

### Path Aliases

TypeScript configured with `@/*` alias pointing to project root. Use for clean imports:

```tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
```

### Type Safety

- Strict TypeScript enabled
- Typed Routes experiment enabled (`typedRoutes: true`) for Expo Router type-safe navigation
- React Compiler enabled for optimization

## Testing & Linting

- ESLint: Uses `eslint-config-expo` (flat config)
- No Jest/unit tests configured yet
- To add testing: Install `@testing-library/react-native` and configure test setup

## Common Pitfalls

1. **Web hydration**: The web-specific hook includes `useState` + `useEffect` to ensure client-side color scheme on first render
2. **Platform-specific code**: Use `.web.ts`/`.ios.ts`/`.android.ts` suffixes or `Platform.select()` from `react-native`
3. **Asset paths**: Images in `assets/images/`; configure in `app.json` (splash, icon, favicon)
4. **Modal navigation**: Use `presentation: 'modal'` in Stack.Screen options (see `app/modal.tsx`)

## Dependencies to Know

- **expo-router**: File-based routing with layout support
- **react-navigation**: Native tab navigation primitives
- **@react-navigation/native**: Core navigation context
- **expo-image**: Cross-platform image component
- **expo-vector-icons**: Ionicons for tab/icon use
- **react-native-reanimated**: Animation library support
- **react-native-screens**: Performance optimization for navigation

## Adding Features

1. Create screen files in `app/` or `app/(tabs)/` following file-based routing
2. Define routes in nearest `_layout.tsx` component
3. Use `@/` imports for constants, hooks, and utilities
4. For platform-specific behavior, create `.web.ts` variants
5. Update theme colors in `constants/theme.ts` if adding new color needs
