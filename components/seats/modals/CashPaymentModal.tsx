import { Button } from "@/components/ui/Button";
import { buildCashPaymentBreakdown, type CashPaymentBreakdown } from "@/lib/pos/orderTransforms";
import { KeypadAmountModal, type KeypadQuickAction } from "./KeypadAmountModal";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

interface CashPaymentModalProps {
  visible: boolean;
  amountDue: number;
  onClose: () => void;
  onPayment: (breakdown: CashPaymentBreakdown) => void;
  onOpenCashDrawer: () => void;
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function parseMoneyInput(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildQuickAmounts(amountDue: number): number[] {
  const roundedDue = Math.ceil(amountDue);
  const candidates = [
    roundedDue,
    Math.ceil(amountDue / 5) * 5,
    20,
    50,
    100,
  ].filter((value) => value > 0);

  return Array.from(new Set(candidates)).sort((a, b) => a - b);
}

export function CashPaymentModal({
  visible,
  amountDue,
  onClose,
  onPayment,
  onOpenCashDrawer,
}: CashPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState("");
  const [gratuity, setGratuity] = useState("");
  const breakdown = useMemo(
    () =>
      buildCashPaymentBreakdown({
        amountDue,
        cashReceived: parseMoneyInput(cashReceived),
        gratuity: parseMoneyInput(gratuity),
      }),
    [amountDue, cashReceived, gratuity]
  );
  const overage = Math.max(0, parseMoneyInput(cashReceived) - amountDue);

  useEffect(() => {
    if (!visible) return;
    setCashReceived(amountDue > 0 ? amountDue.toFixed(2) : "");
    setGratuity("");
  }, [amountDue, visible]);

  const quickActions: KeypadQuickAction[] = [
    {
      label: "Exact",
      tone: "green",
      onPress: () => setCashReceived(amountDue.toFixed(2)),
    },
    {
      label: "Overage as Tip",
      tone: "orange",
      onPress: () => {
        if (overage > 0) setGratuity(overage.toFixed(2));
      },
    },
    {
      label: "Open Drawer",
      tone: "blue",
      onPress: onOpenCashDrawer,
    },
  ];

  return (
    <KeypadAmountModal
      visible={visible}
      title="Cash Pay"
      amount={cashReceived}
      amountLabel="Cash Received"
      confirmLabel="Confirm Cash"
      quickActions={quickActions}
      quickAmounts={buildQuickAmounts(amountDue)}
      onAmountChange={setCashReceived}
      onQuickAmount={(amount) => setCashReceived(amount.toFixed(2))}
      onClose={onClose}
      onConfirm={() => {
        if (breakdown.paymentTotal <= 0) return;
        onPayment(breakdown);
        onClose();
      }}
    >
      <View className="gap-3">
        <View className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <View className="flex-row justify-between">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Amount Due
            </Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {money(amountDue)}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Payment
            </Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {money(breakdown.basePayment)}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Change Due
            </Text>
            <Text className="text-base font-bold text-green-600">
              {money(breakdown.changeDue)}
            </Text>
          </View>
        </View>

        <View className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <Text className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Gratuity / Tip
          </Text>
          <TextInput
            value={gratuity}
            onChangeText={setGratuity}
            keyboardType="decimal-pad"
            placeholder="0.00"
            className="rounded-lg bg-slate-50 px-3 py-3 text-base font-semibold text-slate-900 dark:bg-slate-800 dark:text-white"
          />
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Applied tip: {money(breakdown.gratuity)}
          </Text>
        </View>

        <Button
          label="Open Cash Drawer"
          icon="file-tray-full"
          variant="outline"
          onPress={onOpenCashDrawer}
        />
      </View>
    </KeypadAmountModal>
  );
}
