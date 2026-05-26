import { MenuAIScannerTab } from "@/components/menu/tabs/MenuAIScannerTab";
import { MenuListTab } from "@/components/menu/tabs/MenuListTab";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useModalAction } from "@/hooks/useModalAction";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";
/**
 * Menu Screen
 *
 * Displays the restaurant menu items.
 * Staff can browse and manage menu items from here.
 * Route: /(tabs)/menu
 */
export default function MenuScreen() {
  const [isScannerVisible, setScannerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleOpenScanner = useCallback(() => setScannerVisible(true), []);
  const handleCloseScanner = useCallback(() => setScannerVisible(false), []);

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
            <Button
              label={t("common.saveChanges")}
              size="sm"
              variant="primary"
              icon="save"
              onPress={() => {}}
            />
        }
      />

      <View className="flex-1">
        <MenuListTab onScanPress={handleOpenScanner} />
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
          <MenuAIScannerTab />
        </View>
      </Modal>
    </View>
  );
}
