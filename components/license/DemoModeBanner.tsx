import { useLicense } from "@/context/license";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { isLicenseActivationEnabled } from "@/lib/config/featureFlags";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export function DemoModeBanner() {
  const { isActivated, setShowActivationModal } = useLicense();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  // 已激活则不显示
  if (isActivated || !isLicenseActivationEnabled()) return null;

  return (
    <TouchableOpacity
      onPress={() => setShowActivationModal(true)}
      activeOpacity={0.8}
      className="flex-row items-center justify-between bg-amber-500 px-4 py-2.5"
    >
      <View className="flex-row items-center flex-1">
        <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="warning" size={14} color="white" />
        </View>
        <View className="flex-1">
          <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="font-semibold text-white" numberOfLines={1}>
            {t("license.demoModeActive")}
          </Text>
          <Text style={{ fontSize: responsive.captionFontSize }} className="text-amber-100" numberOfLines={1}>
            {t("license.tapToActivate")}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center rounded-full bg-white/20 px-3 py-1.5">
        <Ionicons name="key" size={responsive.buttonIconSize - 10} color="white" />
        <Text style={{ fontSize: responsive.captionFontSize }} className="ml-1.5 font-semibold text-white">
          {t("license.activate")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
