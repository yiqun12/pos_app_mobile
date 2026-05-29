import { Button } from "@/components/ui/Button";
import {
  buildCashPaymentBreakdown,
  buildCashReceivedForTip,
  calculateCashGratuityFromPercent,
  type CashPaymentBreakdown,
} from "@/lib/pos/orderTransforms";
import { KeypadAmountModal, type KeypadQuickAction } from "./KeypadAmountModal";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CashPaymentModalProps {
  visible: boolean;
  amountDue: number;
  tipBaseAmount: number;
  onClose: () => void;
  onPayment: (breakdown: CashPaymentBreakdown) => void;
  onOpenCashDrawer: () => void;
}

type CashInputTarget = "cash" | "tip";

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
  tipBaseAmount,
  onClose,
  onPayment,
  onOpenCashDrawer,
}: CashPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState("");
  const [gratuity, setGratuity] = useState("");
  const [activeInput, setActiveInput] = useState<CashInputTarget>("cash");
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
    setActiveInput("cash");
  }, [amountDue, visible]);

  const setActiveAmount = (value: string) => {
    if (activeInput === "tip") {
      updateGratuity(value);
      return;
    }
    setCashReceived(value);
  };

  const updateGratuity = (value: string) => {
    setGratuity(value);
    const nextTip = parseMoneyInput(value);
    if (nextTip <= 0) return;
    setCashReceived((currentCash) =>
      buildCashReceivedForTip({
        amountDue,
        currentCashReceived: parseMoneyInput(currentCash),
        gratuity: nextTip,
      }).toFixed(2)
    );
  };

  const applyTipPercent = (percent: number) => {
    const nextTip = calculateCashGratuityFromPercent({
      subtotal: tipBaseAmount,
      percent,
    });
    updateGratuity(nextTip.toFixed(2));
    setActiveInput("tip");
  };

  const quickActions: KeypadQuickAction[] = [
    {
      label: "Exact",
      tone: "green",
      onPress: () => {
        setCashReceived(amountDue.toFixed(2));
        setActiveInput("cash");
      },
    },
    {
      label: "Overage as Tip",
      tone: "orange",
      onPress: () => {
        if (overage > 0) updateGratuity(overage.toFixed(2));
        setActiveInput("tip");
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
      amount={activeInput === "tip" ? gratuity : cashReceived}
      amountLabel={activeInput === "tip" ? "Tip / Gratuity" : "Cash Received"}
      confirmLabel="Confirm Cash"
      quickActions={quickActions}
      quickAmounts={activeInput === "tip" ? [1, 2, 3, 5, 10, 15, 20] : buildQuickAmounts(amountDue)}
      onAmountChange={setActiveAmount}
      onQuickAmount={(amount) => setActiveAmount(amount.toFixed(2))}
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
              Tip
            </Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {money(breakdown.gratuity)}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Payment Total
            </Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {money(breakdown.paymentTotal)}
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

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveInput("cash")}
            className={`flex-1 rounded-lg border p-4 ${
              activeInput === "cash"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Cash Received
            </Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {money(parseMoneyInput(cashReceived))}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveInput("tip")}
            className={`flex-1 rounded-lg border p-4 ${
              activeInput === "tip"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Tip / Gratuity
            </Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {money(breakdown.gratuity)}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tip Base
            </Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {money(tipBaseAmount)}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {[15, 18, 20].map((percent) => (
              <TouchableOpacity
                key={percent}
                onPress={() => applyTipPercent(percent)}
                className="min-h-[42px] flex-1 basis-[30%] items-center justify-center rounded-lg bg-purple-600 px-3"
              >
                <Text className="text-sm font-bold text-white">
                  {percent}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
