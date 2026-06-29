import { Colors } from "@/constants/theme";
import type { BankReceiptPreviewModel } from "@/lib/pos/bankReceipt";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

type BankReceiptPreviewModalProps = {
  visible: boolean;
  colors: ColorMode;
  loading?: boolean;
  error?: string | null;
  model?: BankReceiptPreviewModel | null;
  onClose: () => void;
};

export function BankReceiptPreviewModal({
  visible,
  colors,
  loading = false,
  error = null,
  model = null,
  onClose,
}: BankReceiptPreviewModalProps) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <View
          className="rounded-t-3xl bg-white dark:bg-slate-950"
          style={{ maxHeight: "88%", paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Text
              className="font-bold text-slate-900 dark:text-white"
              style={{ fontSize: responsive.baseFontSize + 2 }}
            >
              {model?.title ?? t("revenue.bankReceiptPreview.title")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center px-4 py-16">
              <ActivityIndicator size="large" color={colors.tint} />
              <Text className="mt-4 font-medium text-slate-500 dark:text-slate-400">
                {t("revenue.bankReceiptLoading")}
              </Text>
            </View>
          ) : error ? (
            <View className="items-center px-6 py-16">
              <Ionicons name="alert-circle-outline" size={42} color="#dc2626" />
              <Text className="mt-4 text-center font-semibold text-red-600">
                {t("revenue.bankReceiptFailed")}
              </Text>
              <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
                {error}
              </Text>
            </View>
          ) : model ? (
            <ScrollView
              className="px-4 py-4"
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <Text
                  className="text-center font-bold text-slate-900 dark:text-white"
                  style={{ fontSize: responsive.baseFontSize + 1 }}
                >
                  {model.storeName}
                </Text>
                {model.storeAddress ? (
                  <Text
                    className="mt-1 text-center text-slate-500 dark:text-slate-400"
                    style={{ fontSize: responsive.captionFontSize }}
                  >
                    {model.storeAddress}
                  </Text>
                ) : null}

                <View className="my-4 h-px bg-slate-300 dark:bg-slate-700" />

                {model.rows.map((row) => (
                  <View
                    key={`${row.label}-${row.value}`}
                    className="mb-3 flex-row items-start justify-between gap-3"
                  >
                    <Text
                      className="flex-1 text-slate-500 dark:text-slate-400"
                      style={{ fontSize: responsive.captionFontSize + 1 }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      className={`max-w-[58%] text-right ${
                        row.emphasize
                          ? "font-bold text-slate-900 dark:text-white"
                          : "font-semibold text-slate-700 dark:text-slate-200"
                      }`}
                      style={{
                        fontSize: row.emphasize
                          ? responsive.baseFontSize
                          : responsive.captionFontSize + 1,
                      }}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}

                {model.paymentCharge ? (
                  <>
                    <View className="my-2 h-px bg-slate-300 dark:bg-slate-700" />
                    <Text
                      className="mb-2 font-bold uppercase text-slate-500 dark:text-slate-400"
                      style={{ fontSize: responsive.captionFontSize }}
                    >
                      {t("revenue.bankReceiptPreview.stripeSection")}
                    </Text>
                    {Object.entries(model.paymentCharge)
                      .filter(([key]) =>
                        ["currency", "paid", "receipt_url", "payment_method_details"].includes(key)
                      )
                      .slice(0, 6)
                      .map(([key, value]) => (
                        <Text
                          key={key}
                          className="mb-1 text-xs text-slate-500 dark:text-slate-400"
                        >
                          {key}:{" "}
                          {typeof value === "string" || typeof value === "number"
                            ? String(value)
                            : JSON.stringify(value)}
                        </Text>
                      ))}
                  </>
                ) : null}
              </View>

              <Text
                className="mt-4 text-center text-slate-400 dark:text-slate-500"
                style={{ fontSize: responsive.captionFontSize }}
              >
                {t("revenue.bankReceiptPreview.phaseOneHint")}
              </Text>
            </ScrollView>
          ) : null}

          <View className="border-t border-slate-200 px-4 pt-3 dark:border-slate-800">
            <TouchableOpacity
              onPress={onClose}
              className="rounded-xl bg-slate-100 py-3.5 dark:bg-slate-800"
            >
              <Text className="text-center font-bold text-slate-900 dark:text-white">
                {t("common.close")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
