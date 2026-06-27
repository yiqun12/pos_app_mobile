import { useLanguage } from "@/context/language";
import { useStoreSelection } from "@/context/store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const ACTIVE_STORE_GREEN = "#01a13d";

type CurrentStoreBadgeProps = {
  /** Show full store name with wider layout (e.g. pinned to screen corner). */
  expanded?: boolean;
};

export function CurrentStoreBadge({ expanded = false }: CurrentStoreBadgeProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const responsive = useResponsiveLayout();
  const { storeList, currentStoreId, isLoading } = useStoreSelection();

  const currentStore = useMemo(
    () => storeList.find((store) => store.id === currentStoreId) ?? null,
    [currentStoreId, storeList]
  );

  const displayName = useMemo(() => {
    if (!currentStore) return t("profile.noStoreSelected");
    if (language === "zh" && currentStore.nameCN) return currentStore.nameCN;
    return currentStore.name;
  }, [currentStore, language, t]);

  const dotColor = currentStore ? ACTIVE_STORE_GREEN : "#94a3b8";
  const fontSize = responsive.isTablet ? 15 : 13;
  const textMaxWidth = expanded
    ? Math.max(responsive.screenWidth * 0.48, 160)
    : responsive.isTablet
      ? 220
      : 140;

  return (
    <TouchableOpacity
      onPress={() => router.push("/select-store")}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t("profile.currentStore")}
      className={`flex-row items-center rounded-full border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900 ${
        expanded ? "self-end" : "max-w-[46%]"
      }`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={ACTIVE_STORE_GREEN} />
      ) : (
        <>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotColor,
              marginRight: 6,
            }}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ fontSize, maxWidth: textMaxWidth }}
            className="font-semibold text-slate-700 dark:text-slate-200"
          >
            {displayName}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
