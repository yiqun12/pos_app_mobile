import { MenuAIScannerTab } from "@/components/menu/tabs/MenuAIScannerTab";
import { MenuListTab } from "@/components/menu/tabs/MenuListTab";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useMenu } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useModalAction } from "@/hooks/useModalAction";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from "react-native";
/**
 * Menu Screen
 *
 * Displays the restaurant menu items.
 * Staff can browse and manage menu items from here.
 * Route: /(tabs)/menu
 */
export default function MenuScreen() {
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [menuFocusVersion, setMenuFocusVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();
  const { refreshMenuData, saving } = useMenu();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleOpenScanner = useCallback(() => setScannerVisible(true), []);
  const handleCloseScanner = useCallback(() => setScannerVisible(false), []);
  const handleScannerSaved = useCallback(() => {
    setScannerVisible(false);
    setMenuFocusVersion((version) => version + 1);
  }, []);
  const handleRefreshMenu = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshMenuData();
      setMenuFocusVersion((version) => version + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh menu data.";
      Alert.alert(t("common.error"), message);
    } finally {
      setRefreshing(false);
    }
  }, [refreshMenuData, refreshing, t]);

  useModalAction((modalName) => {
    if (modalName === "scanner") {
      setScannerVisible(true);
    }
  });

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("menu.managementTitle")}
        rightElement={
          <TouchableOpacity
            className={`min-h-[44px] flex-row items-center justify-center rounded-xl border-2 border-orange-500 bg-transparent px-3 ${
              saving || refreshing ? "opacity-50" : ""
            }`}
            disabled={saving || refreshing}
            onPress={handleRefreshMenu}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Ionicons name="refresh" size={18} color="#f97316" />
            )}
            <Text className="ml-2 text-sm font-semibold text-orange-500 dark:text-orange-400">
              {t("common.refresh")}
            </Text>
          </TouchableOpacity>
        }
      />

      <View className="flex-1">
        <MenuListTab
          onScanPress={handleOpenScanner}
          focusFirstCategoryVersion={menuFocusVersion}
        />
      </View>

      {/* AI Scanner Modal */}
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseScanner}
      >
        <View className="flex-1 bg-white dark:bg-slate-950">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {t("menu.aiScannerTitle")}
            </Text>
            <TouchableOpacity
              onPress={handleCloseScanner}
              className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <MenuAIScannerTab onSaved={handleScannerSaved} />
        </View>
      </Modal>
    </View>
  );
}
