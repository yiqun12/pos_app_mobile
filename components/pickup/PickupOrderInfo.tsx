import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function PickupOrderInfo() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  return (
    <>
      <Text className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        {t("pickup.newPickupOrder")}
      </Text>
      <Text className="mb-4 text-sm leading-5 text-slate-500 dark:text-slate-400">
        {t("pickup.orderDescription")}
      </Text>

      <View className="flex-row gap-2 rounded-lg bg-blue-100 px-3 py-3 dark:bg-blue-950">
        <Ionicons name="information-circle" size={20} color={colors.tint} />
        <Text className="flex-1 text-xs leading-4.5 text-slate-900 dark:text-white">
          {t("pickup.orderInfoTip")}
        </Text>
      </View>
    </>
  );
}
