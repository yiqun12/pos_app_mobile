import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { Text, View } from "react-native";

export function SeatsLegend() {
  const responsive = useResponsiveLayout();
  const indicatorSize = responsive.isTablet ? 5 : 3.5;
  const textSize = responsive.isTablet ? 14 : 12;
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
            className="rounded bg-slate-300"
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
            className="text-slate-900 dark:text-white"
          >
            Vacant
          </Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="rounded bg-yellow-400"
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
            className="text-slate-900 dark:text-white"
          >
            Reserved
          </Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="rounded bg-red-500"
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
            className="text-slate-900 dark:text-white"
          >
            Occupied
          </Text>
        </View>
      </View>
    </View>
  );
}
