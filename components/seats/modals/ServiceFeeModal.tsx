import { KeypadAmountModal, KeypadQuickAction } from "@/components/seats/modals/KeypadAmountModal";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface ServiceFeeModalProps {
  visible: boolean;
  baseAmount: number;
  currentAmount: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const QUICK_PERCENTAGES = [0.15, 0.18, 0.2, 0.25];

export function ServiceFeeModal({
  visible,
  baseAmount,
  currentAmount,
  onClose,
  onConfirm,
}: ServiceFeeModalProps) {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (visible) setAmount(currentAmount > 0 ? currentAmount.toFixed(2) : "");
  }, [currentAmount, visible]);

  const applyPercent = (percent: number) => {
    setAmount((Math.max(0, baseAmount) * percent).toFixed(2));
  };

  const quickActions: KeypadQuickAction[] = QUICK_PERCENTAGES.map((percent) => ({
    label: `${(percent * 100).toFixed(0)}%`,
    tone: "green",
    onPress: () => applyPercent(percent),
  }));

  const handleCancelAdd = () => {
    onConfirm(0);
    onClose();
  };

  return (
    <KeypadAmountModal
      visible={visible}
      title="Add Service Fee"
      amount={amount}
      amountLabel="Service fee amount"
      confirmLabel="Add Service Fee"
      cancelLabel="Cancel Add"
      quickActions={quickActions}
      onAmountChange={setAmount}
      onQuickAmount={(quickAmount) => setAmount(quickAmount.toFixed(2))}
      onClose={onClose}
      onClear={handleCancelAdd}
      onConfirm={(nextAmount) => {
        onConfirm(nextAmount);
        onClose();
      }}
    >
      <View className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Base amount
        </Text>
        <Text className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          ${baseAmount.toFixed(2)}
        </Text>
        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Pick a percentage or enter the service fee amount directly.
        </Text>
      </View>
    </KeypadAmountModal>
  );
}
