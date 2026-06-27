import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ColorMode = (typeof Colors)["light"];

type RevenueAdjustOrderModalProps = {
  visible: boolean;
  colors: ColorMode;
  initialTotal: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (total: number, note: string) => void;
};

function normalizeAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [head, ...tail] = cleaned.split(".");
  if (tail.length === 0) return head;
  return `${head}.${tail.join("").slice(0, 2)}`;
}

export function RevenueAdjustOrderModal({
  visible,
  colors,
  initialTotal,
  saving,
  onClose,
  onSave,
}: RevenueAdjustOrderModalProps) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const [amount, setAmount] = useState(initialTotal.toFixed(2));
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!visible) return;
    setAmount(initialTotal.toFixed(2));
    setNote("");
  }, [initialTotal, visible]);

  const parsed = Number.parseFloat(amount);
  const canSave = Number.isFinite(parsed) && parsed >= 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/45 px-5">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="rounded-2xl bg-white p-4 dark:bg-slate-900">
          <Text
            style={{ fontSize: responsive.headingFontSize }}
            className="font-bold text-slate-900 dark:text-white"
          >
            {t("revenue.adjustOrder")}
          </Text>

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {t("revenue.newTotal")}
          </Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(normalizeAmountInput(value))}
            keyboardType="decimal-pad"
            className="mt-2 rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
          />

          <Text className="mt-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {t("revenue.adjustmentNote")}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            className="mt-2 min-h-[80] rounded-xl border border-slate-200 px-3 py-3 text-base text-slate-900 dark:border-slate-700 dark:text-white"
            placeholder={t("revenue.adjustmentNotePlaceholder")}
            placeholderTextColor="#94a3b8"
            multiline
          />

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-orange-500 py-3.5"
            >
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="text-center font-bold text-orange-600"
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave(parsed, note)}
              disabled={!canSave}
              className={`flex-1 rounded-xl py-3.5 ${canSave ? "bg-orange-500" : "bg-slate-300"}`}
            >
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="text-center font-bold text-white"
              >
                {saving ? t("common.loading") : t("revenue.saveAdjustment")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
