import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconOnly?: boolean;
  stacked?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  iconOnly = false,
  stacked = false,
  loading,
  className,
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const responsive = useResponsiveLayout();
  const baseStyle = "flex-row items-center justify-center rounded-xl";

  const variants = {
    primary: "bg-orange-500 border-2 border-transparent active:bg-orange-600",
    secondary: "bg-slate-100 dark:bg-slate-800 border-2 border-transparent",
    outline: "border-2 border-orange-500 bg-transparent",
    ghost: "bg-transparent border-2 border-transparent",
    danger: "bg-red-500 border-2 border-transparent",
  };

  // Responsive padding - tablet gets larger touch targets
  const baseSizes = {
    sm: { px: 10, py: 6, fontSize: 13 },
    md: { px: 14, py: 9, fontSize: 14 },
    lg: { px: 18, py: 12, fontSize: 16 },
  };

  const sizes = responsive.isTablet
    ? {
        sm: {
          px: responsive.smallSpacing + 3,
          py: responsive.smallSpacing,
          fontSize: responsive.baseFontSize - 1,
        },
        md: {
          px: responsive.baseSpacing + 4,
          py: responsive.smallSpacing + 1,
          fontSize: responsive.baseFontSize - 1,
        },
        lg: {
          px: responsive.mediumSpacing,
          py: responsive.baseSpacing - 2,
          fontSize: responsive.baseFontSize,
        },
      }
    : baseSizes;

  // Text colors
  const textStyles = {
    primary: "text-white",
    secondary: "text-slate-900 dark:text-white",
    outline: "text-orange-500 dark:text-orange-400 font-semibold",
    ghost: "text-orange-500 dark:text-orange-400 font-semibold",
    danger: "text-white",
  };

  // Icon colors mapping
  const iconColors = {
    primary: "white",
    secondary: undefined,
    outline: "#F97316", // orange-500
    ghost: "#F97316", // orange-500
    danger: "white",
  };

  const sizeConfig = sizes[size];
  const buttonClass = `${baseStyle} ${stacked ? "flex-col" : ""} ${variants[variant]} ${disabled ? "opacity-50" : ""} ${className || ""}`;
  const textClass = `font-semibold ${textStyles[variant]} ${icon && !iconOnly && !stacked ? "ml-2" : ""}`;
  const stackedTextClass = `font-medium ${textStyles[variant]} mt-1 text-center`;
  const iconOnlySize = Math.max(responsive.minTouchTargetSize, sizeConfig.px * 2 + responsive.buttonIconSize);

  const getIconColor = () => {
    if (iconColors[variant]) return iconColors[variant];
    if (variant === "secondary") return "#1e293b";
    return "white";
  };

  return (
    <TouchableOpacity
      className={buttonClass}
      style={{
        paddingHorizontal: iconOnly ? 0 : stacked ? 4 : sizeConfig.px,
        paddingVertical: iconOnly ? 0 : stacked ? 6 : sizeConfig.py,
        minHeight: responsive.minTouchTargetSize,
        minWidth: iconOnly ? iconOnlySize : undefined,
        width: iconOnly ? iconOnlySize : undefined,
      }}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : stacked ? (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={responsive.buttonIconSize + 1}
              color={getIconColor()}
            />
          )}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{
              fontSize: responsive.captionFontSize,
            }}
            className={stackedTextClass}
          >
            {label}
          </Text>
        </>
      ) : iconOnly ? (
        icon ? (
          <Ionicons
            name={icon}
            size={responsive.buttonIconSize + 1}
            color={getIconColor()}
          />
        ) : null
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={responsive.buttonIconSize}
              color={getIconColor()}
            />
          )}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={{
              fontSize: sizeConfig.fontSize,
            }}
            className={textClass}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
