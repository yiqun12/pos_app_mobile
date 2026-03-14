/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#F97316', // Orange-500
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#F97316', // Orange-500
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FB923C', // Orange-400
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FB923C', // Orange-400
  },
};

// Shared sizing tokens aligned with common Tailwind scale values.
export const TW = {
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    18: 72,
    20: 80,
    24: 96,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
  },
} as const;

export const BottomTabTokens = {
  phone: {
    iconSize: TW.spacing[7],
    barHeight: 66,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: TW.spacing[2],
    itemPaddingVertical: 0,
    itemMinHeight: 48,
    labelFontSize: TW.fontSize.xs,
    labelLineHeight: TW.fontSize.sm,
    iconMarginRight: TW.spacing[1],
  },
  tablet: {
    iconSize: TW.spacing[11],
    barHeight: 116,
    paddingTop: TW.spacing[2],
    paddingBottom: TW.spacing[4],
    paddingHorizontal: TW.spacing[5],
    itemPaddingVertical: TW.spacing[1],
    itemMinHeight: 86,
    labelFontSize: TW.fontSize.xl,
    labelLineHeight: TW.fontSize["2xl"],
    iconMarginRight: TW.spacing[2],
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
