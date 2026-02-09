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
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const responsive = useResponsiveLayout();
  const baseStyle = "flex-row items-center justify-center rounded-lg";

  const variants = {
    primary: "bg-blue-600 border-2 border-transparent",
    secondary: "bg-slate-100 dark:bg-slate-800 border-2 border-transparent",
    outline: "border-2 border-blue-500 bg-transparent",
    ghost: "bg-transparent border-2 border-transparent",
    danger: "bg-red-500 border-2 border-transparent",
  };

  // Responsive padding - tablet gets larger touch targets
  const baseSizes = {
    sm: { px: 12, py: 6, fontSize: 14 },
    md: { px: 16, py: 10, fontSize: 16 },
    lg: { px: 24, py: 14, fontSize: 18 },
  };

  const sizes = responsive.isTablet
    ? {
        sm: {
          px: responsive.smallSpacing + 4,
          py: responsive.smallSpacing,
          fontSize: responsive.baseFontSize - 2,
        },
        md: {
          px: responsive.baseSpacing + 8,
          py: responsive.baseSpacing - 2,
          fontSize: responsive.baseFontSize,
        },
        lg: {
          px: responsive.mediumSpacing,
          py: responsive.baseSpacing,
          fontSize: responsive.subheadingFontSize,
        },
      }
    : baseSizes;

  // Text colors
  const textStyles = {
    primary: "text-white",
    secondary: "text-slate-900 dark:text-white",
    outline: "text-blue-500 dark:text-blue-400 font-semibold",
    ghost: "text-blue-500 dark:text-blue-400 font-semibold",
    danger: "text-white",
  };

  // Icon colors mapping
  const iconColors = {
    primary: "white",
    secondary: undefined,
    outline: "#3b82f6",
    ghost: "#3b82f6",
    danger: "white",
  };

  const sizeConfig = sizes[size];
  const buttonClass = `${baseStyle} ${variants[variant]} ${disabled ? "opacity-50" : ""} ${className || ""}`;
  const textClass = `font-semibold ${textStyles[variant]} ${icon ? "ml-2" : ""}`;

  const getIconColor = () => {
    if (iconColors[variant]) return iconColors[variant];
    if (variant === "secondary") return "#1e293b";
    return "white";
  };

  return (
    <TouchableOpacity
      className={buttonClass}
      style={{
        paddingHorizontal: sizeConfig.px,
        paddingVertical: sizeConfig.py,
        minHeight: responsive.minTouchTargetSize,
      }}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
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
