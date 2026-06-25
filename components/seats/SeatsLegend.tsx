import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function SeatsLegend() {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
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
            className="rounded"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
              backgroundColor: "#966f33",
              borderColor: "#805c28",
              borderWidth: 1,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            {t("seats.legend.available")}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View
            className="rounded"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
              backgroundColor: "#00008b",
              borderColor: "#000066",
              borderWidth: 1,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            {t("seats.legend.occupied")}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View
            className="rounded"
            style={{
              width: indicatorSize * 2,
              height: indicatorSize * 2,
              marginRight: responsive.smallSpacing,
              backgroundColor: "#8c2828",
              borderColor: "#702020",
              borderWidth: 1,
            }}
          />
          <Text
            style={{
              fontSize: textSize,
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            {t("seats.legend.reserved")}
          </Text>
        </View>
      </View>
    </View>
  );
}
