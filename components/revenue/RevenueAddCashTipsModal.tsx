import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RevenueAddCashTipsModalProps = {
  visible: boolean;
  subtotal: number;
  currentTotal: number;
  currentTips: number;
  saving?: boolean;
  embedded?: boolean;
  onClose: () => void;
  onSave: (extraTip: number) => void;
};

function normalizeAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [head, ...tail] = cleaned.split(".");
  if (tail.length === 0) return head;
  return `${head}.${tail.join("").slice(0, 2)}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function RevenueAddCashTipsContent({
  subtotal,
  currentTotal,
  currentTips,
  saving,
  onClose,
  onSave,
}: Omit<RevenueAddCashTipsModalProps, "visible" | "embedded">) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const [tipAmount, setTipAmount] = useState("0.00");

  useEffect(() => {
    setTipAmount("0.00");
  }, [currentTotal, currentTips]);

  const parsedExtra = Number.parseFloat(tipAmount);
  const extraTip = Number.isFinite(parsedExtra) ? Math.max(0, parsedExtra) : 0;
  const previewTips = roundMoney(currentTips + extraTip);
  const previewTotal = roundMoney(currentTotal - currentTips + previewTips);
  const canSave = Number.isFinite(parsedExtra) && parsedExtra >= 0 && !saving;

  const percentButtons = useMemo(
    () => [
      { label: t("revenue.tipPercent15"), ratio: 0.15 },
      { label: t("revenue.tipPercent18"), ratio: 0.18 },
      { label: t("revenue.tipPercent20"), ratio: 0.2 },
    ],
    [t]
  );

  return (
    <View className="rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text
        style={{ fontSize: responsive.headingFontSize }}
        className="text-center font-bold text-slate-900 dark:text-white"
      >
        {t("revenue.addExtraGratuity")}
      </Text>

      <Text className="mt-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {t("revenue.gratuityAmount")}
      </Text>
      <TextInput
        value={tipAmount}
        onChangeText={(value) => setTipAmount(normalizeAmountInput(value))}
        keyboardType="decimal-pad"
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white"
        placeholder="0.00"
        placeholderTextColor="#94a3b8"
      />

      <View className="mt-3 flex-row gap-2">
        {percentButtons.map((button) => (
          <TouchableOpacity
            key={button.label}
            onPress={() =>
              setTipAmount(roundMoney(subtotal * button.ratio).toFixed(2))
            }
            disabled={saving}
            className="flex-1 rounded-lg bg-violet-600 py-2.5"
          >
            <Text className="text-center text-sm font-semibold text-white">
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mt-4 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
        <Text className="text-sm text-slate-600 dark:text-slate-300">
          {t("revenue.currentTips")}: ${currentTips.toFixed(2)}
        </Text>
        <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("revenue.previewTotal")}: ${previewTotal.toFixed(2)}
        </Text>
      </View>

      <View className="mt-5 flex-row gap-3">
        <TouchableOpacity
          onPress={onClose}
          disabled={saving}
          className="flex-1 rounded-xl bg-red-500 py-3.5"
        >
          <Text
            style={{ fontSize: responsive.baseFontSize }}
            className="text-center font-bold text-white"
          >
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSave(extraTip)}
          disabled={!canSave}
          className={`flex-1 rounded-xl py-3.5 ${canSave ? "bg-green-600" : "bg-slate-300"}`}
        >
          <Text
            style={{ fontSize: responsive.baseFontSize }}
            className="text-center font-bold text-white"
          >
            {saving ? t("common.loading") : t("revenue.confirmAddTips")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RevenueAddCashTipsModal({
  visible,
  embedded = false,
  onClose,
  ...contentProps
}: RevenueAddCashTipsModalProps) {
  if (!visible) return null;

  if (embedded) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        className="z-50 justify-center bg-black/45 px-5"
        pointerEvents="box-none"
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <RevenueAddCashTipsContent onClose={onClose} {...contentProps} />
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/45 px-5">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <RevenueAddCashTipsContent onClose={onClose} {...contentProps} />
      </View>
    </Modal>
  );
}
