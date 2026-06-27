import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, ViewProps } from "react-native";

interface ScreenHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  showCloseButton?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  rightElement,
  showBackButton = false,
  showCloseButton = false,
  children,
  className,
  ...props
}: ScreenHeaderProps) {
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].text;
  const headerPadding = responsive.isTablet ? responsive.baseSpacing : 16;
  const headerGap = responsive.isTablet ? responsive.smallSpacing : 10;
  const backButtonSize = responsive.isTablet ? 24 : 22;

  return (
    <View
      className={`border-b border-slate-200 dark:border-slate-800 ${className || ""}`}
      style={{
        gap: headerGap,
        paddingHorizontal: headerPadding,
        paddingVertical: headerPadding,
      }}
      {...props}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {showBackButton && !showCloseButton && (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={backButtonSize}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
          {showCloseButton && (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={backButtonSize} color={iconColor} />
            </TouchableOpacity>
          )}
          <View>
            <Text
              style={{
                fontSize: responsive.headingFontSize,
              }}
              className="font-bold text-slate-900 dark:text-white"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  fontSize: responsive.subheadingFontSize,
                }}
                className="text-slate-500 dark:text-slate-400"
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View className="max-w-[52%] shrink-0 flex-row items-center justify-end gap-2">
          {rightElement}
        </View>
      </View>
      {children}
    </View>
  );
}
