import { useWindowDimensions } from "react-native";

// ─── 字体缩放倍率配置 ──────────────────────────────────────────
// Keep typography dense enough for POS screens; touch targets stay large.
const FONT_SCALE = {
  phone:       1.0,
  tablet:      1.08,
  largeTablet: 1.14,
};

const PHONE_FONTS = {
  base:       15,
  heading:    22,
  subheading: 15,
  caption:    11,
};
// ──────────────────────────────────────────────────────────────

export interface ResponsiveValues {
  isTablet: boolean;
  isLargeTablet: boolean;
  screenWidth: number;
  // Seat dimensions
  seatSize: number;
  seatBorderRadius: number;
  // Font sizes
  baseFontSize: number;
  headingFontSize: number;
  subheadingFontSize: number;
  captionFontSize: number;
  // Spacing & Padding
  baseSpacing: number;
  smallSpacing: number;
  mediumSpacing: number;
  largeSpacing: number;
  // Button sizes
  buttonPaddingX: number;
  buttonPaddingY: number;
  buttonIconSize: number;
  // Touch targets
  minTouchTargetSize: number;
}

/**
 * Provides responsive layout values based on screen width.
 * Tablet threshold: 768px (iPad mini and larger)
 * Large tablet threshold: 1024px (iPad Pro 12.9")
 */
export function useResponsiveLayout(): ResponsiveValues {
  const { width } = useWindowDimensions();

  // Tablet detection thresholds
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  // Seat sizing
  const seatSize = isTablet ? 90 : 80;
  const seatBorderRadius = isTablet ? 20 : 16;

  // Font sizes - tablet gets slightly more presence without bloating dense POS screens.
  const scale = isLargeTablet
    ? FONT_SCALE.largeTablet
    : isTablet
    ? FONT_SCALE.tablet
    : FONT_SCALE.phone;

  const baseFontSize       = Math.round(PHONE_FONTS.base       * scale);
  const headingFontSize    = Math.round(PHONE_FONTS.heading     * scale);
  const subheadingFontSize = Math.round(PHONE_FONTS.subheading  * scale);
  const captionFontSize    = Math.round(PHONE_FONTS.caption     * scale);

  // Spacing & Padding
  const baseSpacing = isLargeTablet ? 16 : isTablet ? 14 : 12;
  const smallSpacing = isLargeTablet ? 10 : isTablet ? 9 : 8;
  const mediumSpacing = isLargeTablet ? 20 : isTablet ? 18 : 16;
  const largeSpacing = isLargeTablet ? 28 : isTablet ? 24 : 22;

  // Button sizing - larger touch targets
  const buttonPaddingX = isLargeTablet ? 20 : isTablet ? 18 : 14;
  const buttonPaddingY = isLargeTablet ? 12 : isTablet ? 11 : 9;
  const buttonIconSize = isLargeTablet ? 22 : isTablet ? 21 : 19;

  // Minimum touch target size per accessibility guidelines (44pt on iPhone)
  const minTouchTargetSize = isTablet ? 48 : 44;

  return {
    isTablet,
    isLargeTablet,
    screenWidth: width,
    seatSize,
    seatBorderRadius,
    baseFontSize,
    headingFontSize,
    subheadingFontSize,
    captionFontSize,
    baseSpacing,
    smallSpacing,
    mediumSpacing,
    largeSpacing,
    buttonPaddingX,
    buttonPaddingY,
    buttonIconSize,
    minTouchTargetSize,
  };
}
