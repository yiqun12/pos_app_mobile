import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export function PickupHeader() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <TouchableOpacity
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center"
      >
        <Ionicons name="chevron-back" size={24} color={colors.tint} />
      </TouchableOpacity>
      <View className="flex-row items-center gap-2">
        <Ionicons name="bag" size={responsive.buttonIconSize} color={colors.tint} />
        <Text style={{ fontSize: responsive.subheadingFontSize }} className="font-semibold text-slate-900 dark:text-white">
          {t("pickup.doordashPickup")}
        </Text>
      </View>
      <View className="h-10 w-10" />
    </View>
  );
}
