import { useWindowDimensions } from "react-native";

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

  // Font sizes - increase for iPad readability
  const baseFontSize = isLargeTablet ? 18 : isTablet ? 17 : 16;
  const headingFontSize = isLargeTablet ? 36 : isTablet ? 32 : 28;
  const subheadingFontSize = isLargeTablet ? 20 : isTablet ? 18 : 16;
  const captionFontSize = isLargeTablet ? 14 : isTablet ? 13 : 12;

  // Spacing & Padding
  const baseSpacing = isLargeTablet ? 20 : isTablet ? 16 : 12;
  const smallSpacing = isLargeTablet ? 12 : isTablet ? 10 : 8;
  const mediumSpacing = isLargeTablet ? 24 : isTablet ? 20 : 16;
  const largeSpacing = isLargeTablet ? 32 : isTablet ? 28 : 24;

  // Button sizing - larger touch targets
  const buttonPaddingX = isLargeTablet ? 28 : isTablet ? 24 : 16;
  const buttonPaddingY = isLargeTablet ? 16 : isTablet ? 14 : 10;
  const buttonIconSize = isLargeTablet ? 28 : isTablet ? 24 : 20;

  // Minimum touch target size per accessibility guidelines (44pt on iPhone)
  const minTouchTargetSize = isTablet ? 52 : 44;

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
