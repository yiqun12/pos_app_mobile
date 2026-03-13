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
    <View className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Order Summary</Text>
      
      <SummaryRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />

      <SummaryRow label="Tax (8.625%)" value={`$${order.taxAmount.toFixed(2)}`} />

      <View className="flex-row justify-between py-1">
         <Text className="text-base font-medium text-slate-700 dark:text-slate-300">Tip</Text>
         <Text className="text-base font-medium text-orange-500">Edit</Text>
      </View>

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

      <View className="my-4 h-[1px] bg-slate-200 dark:bg-slate-700" />

      <View className="flex-row justify-between py-1 items-end">
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Amount</Text>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
            ${order.total.toFixed(2)}
        </Text>
      </View>

      {order.status !== "unpaid" && (
        <View className="mt-2">
            <SummaryRow label="Paid" value={`$${order.paidAmount.toFixed(2)}`} />
            {order.paidAmount < order.total && (
                <SummaryRow
                label="Remaining"
                value={`$${(order.total - order.paidAmount).toFixed(2)}`}
                />
            )}
        </View>
      )}
    </View>
  );
}
