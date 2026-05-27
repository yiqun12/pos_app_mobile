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
  const headerPadding = responsive.isTablet ? responsive.baseSpacing : 14;
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
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          {showBackButton && !showCloseButton && (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons
                name="arrow-back"
                size={backButtonSize}
                color="#0f172a"
              />
            </TouchableOpacity>
          )}
          {showCloseButton && (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={backButtonSize} color="#0f172a" />
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
        <View className="flex-row items-center gap-2">{rightElement}</View>
      </View>
      {children}
    </View>
  );
}
