import { KeypadAmountModal, KeypadQuickAction } from "@/components/seats/modals/KeypadAmountModal";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface AdjustmentModalProps {
  visible: boolean;
  baseAmount?: number;
  currentAmount?: number;
  mode?: "adjustment" | "targetTotal";
  taxExempt?: boolean;
  onClose: () => void;
  onConfirm: (amount: number, taxExempt?: boolean) => void;
  onTaxExemptChange?: (enabled: boolean) => void;
}

export function AdjustmentModal({
  visible,
  baseAmount = 0,
  currentAmount,
  mode = "adjustment",
  taxExempt = false,
  onClose,
  onConfirm,
  onTaxExemptChange,
}: AdjustmentModalProps) {
  const [amount, setAmount] = useState("");
  const [draftTaxExempt, setDraftTaxExempt] = useState(taxExempt);
  const { t } = useTranslation();
  const targetAmount = currentAmount ?? baseAmount;

  useEffect(() => {
    if (!visible) return;
    setAmount(mode === "targetTotal" && targetAmount > 0 ? targetAmount.toFixed(2) : "");
    setDraftTaxExempt(taxExempt);
  }, [baseAmount, currentAmount, mode, targetAmount, taxExempt, visible]);

  const applyPercentDiscount = (percent: number) => {
    if (baseAmount <= 0) return;
    if (mode === "targetTotal") {
      setAmount((baseAmount * (1 - percent)).toFixed(2));
      return;
    }
    setAmount((-(baseAmount * percent)).toFixed(2));
  };

  const difference = mode === "targetTotal" && amount.length > 0
    ? parseFloat(amount) - baseAmount
    : 0;
  const hasDifference = Number.isFinite(difference) && Math.abs(difference) >= 0.01;
  const quickActions: KeypadQuickAction[] = [0.05, 0.15, 0.25].map((percent) => ({
    label: `${(percent * 100).toFixed(0)}% Off`,
    tone: "orange",
    onPress: () => applyPercentDiscount(percent),
  }));

  return (
    <KeypadAmountModal
      visible={visible}
      title={mode === "targetTotal" ? "Adjust Total" : t("seats.adjustment.title")}
      amount={amount}
      amountLabel={mode === "targetTotal" ? "New total" : t("seats.adjustment.amountLabel")}
      confirmLabel={mode === "targetTotal" ? "Adjust Total" : t("seats.adjustment.apply")}
      quickActions={quickActions}
      onAmountChange={setAmount}
      onQuickAmount={(quickAmount) => setAmount(quickAmount.toFixed(2))}
      onClose={onClose}
      onConfirm={(nextAmount) => {
        onConfirm(
          mode === "targetTotal" ? nextAmount - baseAmount : nextAmount,
          mode === "targetTotal" ? draftTaxExempt : taxExempt
        );
        if (mode === "targetTotal") onTaxExemptChange?.(draftTaxExempt);
        onClose();
        setAmount("");
      }}
    >
      {mode === "targetTotal" && (
        <View className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <Text className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Enter the new subtotal before tax and service fee. Lower becomes discount; higher becomes surcharge.
          </Text>
          <View className="mb-2 flex-row justify-between">
            <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Original Total
            </Text>
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              ${baseAmount.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
              New Total
            </Text>
            <Text className="text-base font-semibold text-purple-600">
              ${Number.isFinite(parseFloat(amount)) ? parseFloat(amount).toFixed(2) : targetAmount.toFixed(2)}
            </Text>
          </View>
          {hasDifference && (
            <View className="mt-3 flex-row justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
              <Text className={`text-sm font-semibold ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                {difference > 0 ? "Surcharge!" : "Discount"}
              </Text>
              <Text className={`text-sm font-semibold ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                {difference > 0 ? "+" : "-"}${Math.abs(difference).toFixed(2)}
              </Text>
            </View>
          )}

          {onTaxExemptChange && (
            <TouchableOpacity
              onPress={() => {
                if (mode === "targetTotal") setDraftTaxExempt((enabled) => !enabled);
                else onTaxExemptChange(!taxExempt);
              }}
              className={`mt-4 rounded-lg px-4 py-4 ${
                (mode === "targetTotal" ? draftTaxExempt : taxExempt) ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <Text
                className={`text-center text-base font-semibold ${
                  (mode === "targetTotal" ? draftTaxExempt : taxExempt) ? "text-white" : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {(mode === "targetTotal" ? draftTaxExempt : taxExempt) ? "✓ Tax Exempt" : "Tax Exempt"}
              </Text>
            </TouchableOpacity>
          )}
      </View>
      )}
    </KeypadAmountModal>
  );
}
