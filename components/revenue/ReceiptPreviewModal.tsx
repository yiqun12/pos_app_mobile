import { Colors } from "@/constants/theme";
import type { ReceiptPreviewModel } from "@/lib/pos/receiptPreviewCore";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

type ReceiptPreviewModalProps = {
  visible: boolean;
  colors: ColorMode;
  model?: ReceiptPreviewModel | null;
  embedded?: boolean;
  onClose: () => void;
};

function MoneyRow({
  label,
  value,
  emphasize = false,
  fontSize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  fontSize: number;
}) {
  if (value === "$0.00" && !emphasize) return null;

  return (
    <View className="mb-1.5 flex-row items-center justify-between gap-3">
      <Text
        className="flex-1 text-slate-600 dark:text-slate-300"
        style={{ fontSize }}
      >
        {label}
      </Text>
      <Text
        className={`${emphasize ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200"}`}
        style={{ fontSize: emphasize ? fontSize + 1 : fontSize }}
      >
        {value}
      </Text>
    </View>
  );
}

function ReceiptPreviewContent({
  colors,
  model,
  onClose,
}: {
  colors: ColorMode;
  model: ReceiptPreviewModel | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const bodyFont = responsive.captionFontSize + 1;

  return (
    <View
      className="rounded-t-3xl bg-white dark:bg-slate-950"
      style={{ maxHeight: "88%", paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <Text
          className="font-bold text-slate-900 dark:text-white"
          style={{ fontSize: responsive.baseFontSize + 2 }}
        >
          {model?.title ?? t("revenue.receiptPreview.title")}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {model ? (
        <ScrollView
          className="px-4 py-4"
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="self-center rounded-2xl border border-slate-300 bg-white px-4 py-5 dark:border-slate-700 dark:bg-slate-900"
            style={{ width: "100%", maxWidth: 360 }}
          >
            <Text
              className="text-center font-bold text-slate-900 dark:text-white"
              style={{ fontSize: responsive.baseFontSize + 2 }}
            >
              {model.storeName}
            </Text>
            {model.storeNameCN ? (
              <Text
                className="mt-1 text-center text-slate-600 dark:text-slate-300"
                style={{ fontSize: bodyFont }}
              >
                {model.storeNameCN}
              </Text>
            ) : null}
            {model.storeAddress ? (
              <Text
                className="mt-1 text-center text-slate-500 dark:text-slate-400"
                style={{ fontSize: bodyFont - 1 }}
              >
                {model.storeAddress}
              </Text>
            ) : null}
            {model.storePhone ? (
              <Text
                className="text-center text-slate-500 dark:text-slate-400"
                style={{ fontSize: bodyFont - 1 }}
              >
                {model.storePhone}
              </Text>
            ) : null}

            <View className="my-4 border-t border-dashed border-slate-300 dark:border-slate-600" />

            <Text style={{ fontSize: bodyFont }} className="text-slate-600 dark:text-slate-300">
              {t("revenue.receiptPreview.table")}: {model.table}
            </Text>
            <Text style={{ fontSize: bodyFont }} className="mt-1 text-slate-600 dark:text-slate-300">
              {t("revenue.receiptPreview.orderId")}: #{model.orderId}
            </Text>
            <Text style={{ fontSize: bodyFont }} className="mt-1 text-slate-600 dark:text-slate-300">
              {t("revenue.receiptPreview.date")}: {model.dateLabel}
            </Text>

            <View className="my-4 border-t border-dashed border-slate-300 dark:border-slate-600" />

            {model.lines.length > 0 ? (
              model.lines.map((line, index) => (
                <View
                  key={`${line.name}-${index}`}
                  className="mb-2 flex-row items-start justify-between gap-2"
                >
                  <Text
                    className="flex-1 text-slate-800 dark:text-slate-100"
                    style={{ fontSize: bodyFont }}
                  >
                    {line.quantity} x {line.name}
                  </Text>
                  <Text
                    className="font-semibold text-slate-800 dark:text-slate-100"
                    style={{ fontSize: bodyFont }}
                  >
                    ${line.total.toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                className="mb-2 text-slate-500 dark:text-slate-400"
                style={{ fontSize: bodyFont }}
              >
                {t("revenue.receiptPreview.noItems")}
              </Text>
            )}

            <View className="my-4 border-t border-dashed border-slate-300 dark:border-slate-600" />

            <MoneyRow
              label={t("revenue.subtotal")}
              value={`$${model.subtotal.toFixed(2)}`}
              fontSize={bodyFont}
            />
            <MoneyRow
              label={t("revenue.tax")}
              value={`$${model.tax.toFixed(2)}`}
              fontSize={bodyFont}
            />
            <MoneyRow
              label={t("revenue.serviceFee")}
              value={`$${model.serviceFee.toFixed(2)}`}
              fontSize={bodyFont}
            />
            <MoneyRow
              label={t("revenue.receiptPreview.discount")}
              value={`-$${model.discount.toFixed(2)}`}
              fontSize={bodyFont}
            />
            {model.kind === "CustomerReceipt" ? (
              <MoneyRow
                label={t("revenue.gratuity")}
                value={`$${model.tips.toFixed(2)}`}
                fontSize={bodyFont}
              />
            ) : null}
            <MoneyRow
              label={t("revenue.receiptPreview.total")}
              value={`$${model.total.toFixed(2)}`}
              emphasize
              fontSize={bodyFont}
            />
          </View>

          <Text
            className="mt-4 text-center text-slate-400 dark:text-slate-500"
            style={{ fontSize: responsive.captionFontSize }}
          >
            {t("revenue.receiptPreview.hint")}
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
  );
}

export function ReceiptPreviewModal({
  visible,
  colors,
  model = null,
  embedded = false,
  onClose,
}: ReceiptPreviewModalProps) {
  if (!visible) return null;

  if (embedded) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        className="z-50 justify-end bg-black/45"
        pointerEvents="box-none"
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
        />
        <ReceiptPreviewContent colors={colors} model={model} onClose={onClose} />
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <ReceiptPreviewContent colors={colors} model={model} onClose={onClose} />
      </View>
    </Modal>
  );
}
