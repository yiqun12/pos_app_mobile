import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string; // e.g. "+12.5%"
  trendUp?: boolean;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  darkBg?: string;
  darkText?: string;
  fullWidth?: boolean;
}

export function StatCard({
  title,
  value,
  trend,
  trendUp,
  fullWidth,
}: StatCardProps) {
  const responsive = useResponsiveLayout();
  const valueFontSize = responsive.isTablet ? responsive.headingFontSize : 20;

  return (
    <View
      className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${fullWidth ? "w-full" : "flex-1"}`}
    >
      <View className="mb-2">
        <Text
          numberOfLines={2}
          style={{ fontSize: responsive.captionFontSize }}
          className="font-medium text-slate-500 dark:text-slate-400"
        >
          {title}
        </Text>
      </View>

      <Text
        numberOfLines={2}
        style={{ fontSize: valueFontSize, lineHeight: valueFontSize + 6 }}
        className="font-bold text-slate-900 dark:text-white"
      >
        {value}
      </Text>

      {trend && (
        <View className="mt-2 flex-row items-center">
          <Ionicons
            name={trendUp ? "trending-up" : "trending-down"}
            size={14}
            color={trendUp ? "#10b981" : "#ef4444"}
          />
          <Text
            style={{ fontSize: responsive.captionFontSize }}
            className={`ml-1 font-medium ${trendUp ? "text-emerald-500" : "text-red-500"}`}
          >
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
}
