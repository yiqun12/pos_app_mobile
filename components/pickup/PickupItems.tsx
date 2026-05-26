import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface PickupItemsProps {
  items?: any[];
}

export function PickupItems({ items = [] }: PickupItemsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  return (
    <>
      <Text className="mb-2 mt-6 text-lg font-semibold text-slate-900 dark:text-white">
        {t("pickup.orderItems")}
      </Text>
      {items.length === 0 ? (
        <View className="items-center justify-center rounded-lg bg-blue-100 py-8 dark:bg-blue-950">
          <Ionicons name="document-text" size={32} color={colors.tint} />
          <Text className="mt-3 text-sm text-slate-900 dark:text-white">
            {t("pickup.noItemsYet")}
          </Text>
        </View>
      ) : (
        <View>
          <Text className="text-slate-900 dark:text-white">
            {t("pickup.itemListPlaceholder")}
          </Text>
        </View>
      )}
    </>
  );
}
