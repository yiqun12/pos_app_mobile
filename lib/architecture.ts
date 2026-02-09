/**
 * 7dollar POS App - Architecture Guide
 *
 * PROJECT STRUCTURE
 * =================
 *
 * app/
 *   _layout.tsx          - Root layout with theme provider & auth context
 *   (tabs)/
 *     _layout.tsx        - Bottom tab navigation (5 tabs)
 *     index.tsx          - Unused placeholder (Expo Router artifact)
 *     seats/
 *       _layout.tsx      - Stack layout for seat screens
 *       index.tsx        - Seats grid (default landing)
 *       [seatId].tsx     - Individual seat order detail
 *     menu/index.tsx     - Menu management tab
 *     revenue/index.tsx  - Revenue dashboard tab
 *     notifications/index.tsx - Alerts tab
 *     profile/index.tsx  - Profile tab
 *   pickup/
 *     new.tsx            - New DoorDash pickup order (full screen)
 *   modal.tsx            - Modal example screen
 *
 * context/
 *   auth.tsx             - Authentication context & hooks
 *                          Manages login/logout/user state
 *
 * hooks/
 *   use-color-scheme.ts  - Color scheme detection for dark/light mode
 *   use-theme-color.ts   - Theme color utilities
 *
 * constants/
 *   theme.ts             - Color and font definitions
 *
 * components/
 *   (Reusable UI components go here)
 *
 * lib/
 *   architecture.ts      - This file - Architecture documentation
 *
 *
 * KEY PATTERNS
 * ============
 *
 * 1. AUTHENTICATION
 *    - Use AuthProvider from context/auth.tsx
 *    - Access auth state with useAuth() hook
 *    - Can conditionally navigate to login screen if needed
 *
 *    Example:
 *    const { isAuthenticated, user, login, logout } = useAuth();
 *
 *
 * 2. THEMING
 *    - Use useColorScheme() hook from hooks/use-color-scheme.ts
 *    - Colors defined in constants/theme.ts
 *    - Access via: Colors[colorScheme ?? 'light']
 *
 *    Example:
 *    const colorScheme = useColorScheme();
 *    const colors = Colors[colorScheme ?? 'light'];
 *
 *
 * 3. NAVIGATION
 *    - Bottom tabs: Seats, Menu, Revenue, Alerts, Profile
 *    - Nested stack: Seats grid → Seat detail with back nav
 *    - Root level: Pickup orders, modals
 *    - Use useRouter() from expo-router
 *
 *    Example:
 *    router.push('/(tabs)/seats/1');
 *    router.back();
 *
 *
 * 4. DATA TYPES
 *    - Seat status: 'vacant' | 'reserved' | 'occupied'
 *    - Mock data currently used in seats/index.tsx
 *    - Ready for API integration
 *
 *
 * NEXT STEPS
 * ==========
 *
 * 1. Connect AuthProvider to actual auth API
 *    - Update context/auth.tsx login/logout methods
 *    - Add conditional navigation based on auth state
 *
 * 2. Add login/signup screens
 *    - Create app/auth/ folder
 *    - Add login.tsx and signup.tsx
 *    - Add auth group to root layout
 *
 * 3. Connect seats to real API
 *    - Replace mock data in (tabs)/seats/index.tsx
 *    - Add WebSocket for real-time updates
 *
 * 4. Add order management API
 *    - Connect seat detail to backend
 *    - Implement add/remove items
 *    - Track order status
 *
 * 5. Add components library
 *    - Reusable buttons, inputs, cards
 *    - Theme-aware styling
 */

export const ARCHITECTURE = {
  description: "7dollar POS App - React Native/Expo with file-based routing",
  structure: {
    app: "File-based routing (Expo Router)",
    context: "State management (Auth)",
    hooks: "Custom React hooks",
    constants: "Theme and configuration",
    components: "Reusable UI components",
    lib: "Utilities and helpers",
  },
};
