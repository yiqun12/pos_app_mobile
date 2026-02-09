import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  showArrow?: boolean;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

export function SettingsItem({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  rightText,
  showArrow = true,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  onPress,
  danger = false,
}: SettingsItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

  const defaultIconBg = danger
    ? "bg-red-100 dark:bg-red-900/30"
    : "bg-blue-100 dark:bg-blue-900/30";
  const defaultIconColor = danger ? "#ef4444" : "#2563eb";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
      className="flex-row items-center rounded-xl bg-slate-50 px-4 py-3.5 dark:bg-slate-900"
    >
      {/* Icon */}
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${iconBgColor || defaultIconBg}`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor || defaultIconColor}
        />
      </View>

      {/* Title & Subtitle */}
      <View className="flex-1">
        <Text
          style={{ fontSize: responsive.baseFontSize }}
          className={`font-medium ${
            danger
              ? "text-red-600 dark:text-red-400"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="mt-0.5 text-slate-500 dark:text-slate-400">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Content */}
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
          thumbColor="white"
        />
      ) : (
        <View className="flex-row items-center">
          {rightText && (
            <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="mr-2 text-slate-500 dark:text-slate-400">
              {rightText}
            </Text>
          )}
          {showArrow && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.tabIconDefault}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

