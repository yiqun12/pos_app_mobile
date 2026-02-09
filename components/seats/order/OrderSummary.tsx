import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Text, View } from "react-native";
import { Order } from "../types";

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const SummaryRow = ({
    label,
    value,
    isTotal = false,
    isNegative = false,
  }: {
    label: string;
    value: string;
    isTotal?: boolean;
    isNegative?: boolean;
  }) => (
    <View className="flex-row justify-between py-1">
      <Text
        className={`${
          isTotal ? "text-xl font-bold" : "text-base font-medium"
        } text-slate-700 dark:text-slate-300`}
      >
        {label}
      </Text>
      <Text
        className={`${
          isTotal ? "text-xl font-bold" : "text-base font-medium"
        } ${isNegative ? "text-red-500" : "text-slate-900 dark:text-white"}`}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <SummaryRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />

      {order.taxAmount > 0 && (
        <SummaryRow label="Tax" value={`$${order.taxAmount.toFixed(2)}`} />
      )}

      {order.serviceFee > 0 && (
        <SummaryRow
          label="Service Fee"
          value={`$${order.serviceFee.toFixed(2)}`}
        />
      )}

      {order.manualAdjustment !== 0 && (
        <SummaryRow
          label="Adjustment"
          value={`${order.manualAdjustment > 0 ? "+" : ""}$${order.manualAdjustment.toFixed(2)}`}
          isNegative={order.manualAdjustment < 0}
        />
      )}

      <View className="my-2 h-[1px] bg-slate-200 dark:bg-slate-700" />

      <SummaryRow label="Total" value={`$${order.total.toFixed(2)}`} isTotal />

      {order.status !== "unpaid" && (
        <SummaryRow label="Paid" value={`$${order.paidAmount.toFixed(2)}`} />
      )}
      {order.status !== "unpaid" && order.paidAmount < order.total && (
        <SummaryRow
          label="Remaining"
          value={`$${(order.total - order.paidAmount).toFixed(2)}`}
        />
      )}
    </View>
  );
}
