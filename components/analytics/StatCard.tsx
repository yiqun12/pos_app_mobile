import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  bgColor: string;
  textColor: string;
  darkBg: string;
  darkText: string;
  fullWidth?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  bgColor,
  textColor,
  darkBg,
  darkText,
  fullWidth = false,
}: StatCardProps) {
  const responsive = useResponsiveLayout();
  return (
    <View
      className={`rounded-lg border border-slate-200 p-3 dark:border-slate-800 ${fullWidth ? "w-full" : "flex-1"} ${bgColor} ${darkBg}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text style={{ fontSize: responsive.captionFontSize }} className="font-semibold text-slate-600 dark:text-slate-400">
            {title}
          </Text>
          <Text style={{ fontSize: responsive.subheadingFontSize }} className={`font-bold ${textColor} ${darkText}`}>
            {value}
          </Text>
        </View>
        <Ionicons
          name={icon as any}
          size={24}
          color={
            textColor.split(
              "-"
            )[1] /* extracting color code from class name might not work if it's hex, but here it's tailwind class text-blue-600. simple approximation or passed prop would be better if split fails. Actually the icon color rendering in previous code was: textColor.split("-")[1]. This is assuming text-color-shade format. The icon color logic is a bit fragile but keeping it as is to match existing behavior. */
          }
        />
      </View>
    </View>
  );
}
