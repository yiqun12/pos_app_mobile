import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { Text, View } from "react-native";

export function SeatsLegend() {
  const responsive = useResponsiveLayout();
  const indicatorSize = responsive.isTablet ? 6 : 3.5;
  const textSize = responsive.isTablet ? 16 : 12;
  const verticalPadding = responsive.isTablet ? responsive.baseSpacing : 12;
  const horizontalPadding = responsive.isTablet ? responsive.mediumSpacing : 16;

  return (
    <View
      className="border-t border-slate-200 dark:border-slate-800"
      style={{
        paddingHorizontal: horizontalPadding,
        paddingVertical: verticalPadding,
      }}
    >
      <View className="flex-row justify-around">
        <View className="flex-row items-center">
          <View
            className="rounded border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            Available | 空桌
          </Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="rounded bg-orange-600"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            Occupied | 已占用
          </Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="rounded bg-orange-200"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            Reserved | 已预订
          </Text>
        </View>
      </View>
    </View>
  );
}
