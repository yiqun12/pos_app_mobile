import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface PickupActionsProps {
  onAddItems: () => void;
  onCompleteOrder: () => void;
}

export function PickupActions({
  onAddItems,
  onCompleteOrder,
}: PickupActionsProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  return (
    <View className="gap-3 px-4 py-4">
      <TouchableOpacity
        className="items-center justify-center rounded-lg border-2 border-blue-500 px-4 py-3"
        onPress={onAddItems}
      >
        <Text
          style={{ fontSize: responsive.baseFontSize }}
          className="font-semibold text-blue-500"
        >
          {t("pickup.addItems")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center justify-center rounded-lg bg-blue-500 px-4 py-3"
        onPress={onCompleteOrder}
      >
        <Text
          style={{ fontSize: responsive.baseFontSize }}
          className="font-semibold text-white"
        >
          {t("pickup.completeOrder")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
