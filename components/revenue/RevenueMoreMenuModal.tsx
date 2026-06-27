import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

type RevenueMoreMenuModalProps = {
  visible: boolean;
  colors: ColorMode;
  onClose: () => void;
  onOpenLineChart: () => void;
};

export function RevenueMoreMenuModal({
  visible,
  colors,
  onClose,
  onOpenLineChart,
}: RevenueMoreMenuModalProps) {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45" onPress={onClose}>
        <View className="flex-1 items-end px-4 pt-16" style={{ paddingTop: insets.top + 56 }}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View className="min-w-[220] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenLineChart();
                }}
                className="flex-row items-center gap-3 px-4 py-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40">
                  <Ionicons name="analytics-outline" size={20} color="#ea580c" />
                </View>
                <Text
                  style={{ fontSize: responsive.baseFontSize }}
                  className="font-semibold text-slate-900 dark:text-white"
                >
                  {t("revenue.lineChart")}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
