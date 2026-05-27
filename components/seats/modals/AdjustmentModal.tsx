import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface AdjustmentModalProps {
  visible: boolean;
  baseAmount?: number;
  taxExempt?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  onTaxExemptChange?: (enabled: boolean) => void;
}

export function AdjustmentModal({
  visible,
  baseAmount = 0,
  taxExempt = false,
  onClose,
  onConfirm,
  onTaxExemptChange,
}: AdjustmentModalProps) {
  const [amount, setAmount] = useState("");
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const handleConfirm = () => {
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      onConfirm(num);
      onClose();
      setAmount("");
    }
  };

  const applyPercentDiscount = (percent: number) => {
    if (baseAmount <= 0) return;
    setAmount((-(baseAmount * percent)).toFixed(2));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setAmount("")}
    >
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {t("seats.adjustment.title")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {t("seats.adjustment.subtitle")}
          </Text>

          <View className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <Text className="mb-1 text-xs font-semibold text-slate-500">
              {t("seats.adjustment.amountLabel")}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numbers-and-punctuation"
              placeholder={t("seats.adjustment.amountPlaceholder")}
              placeholderTextColor="#94a3b8"
              className="text-2xl font-bold text-slate-900 dark:text-white"
              autoFocus
            />
          </View>

          <View className="mb-4 flex-row gap-2">
            {[0.05, 0.15, 0.25].map((percent) => (
              <TouchableOpacity
                key={percent}
                onPress={() => applyPercentDiscount(percent)}
                className="flex-1 rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20"
              >
                <Text className="text-center font-semibold text-orange-700 dark:text-orange-300">
                  {(percent * 100).toFixed(0)}% off
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {onTaxExemptChange && (
            <TouchableOpacity
              onPress={() => onTaxExemptChange(!taxExempt)}
              className={`mb-6 rounded-lg px-4 py-3 ${
                taxExempt ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  taxExempt ? "text-white" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Tax Exempt {taxExempt ? "On" : "Off"}
              </Text>
            </TouchableOpacity>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label={t("common.cancel")} variant="ghost" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button label={t("seats.adjustment.apply")} onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
