import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { appendAmountKey, parseAmountInput } from "@/lib/pos/amountInput";
import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export type KeypadQuickAction = {
  label: string;
  tone?: "green" | "orange" | "blue" | "slate";
  onPress: () => void;
};

interface KeypadAmountModalProps {
  visible: boolean;
  title: string;
  amount: string;
  amountLabel: string;
  confirmLabel: string;
  cancelLabel?: string;
  quickActions?: KeypadQuickAction[];
  quickAmounts?: number[];
  onAmountChange: (amount: string) => void;
  onQuickAmount?: (amount: number) => void;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  onClear?: () => void;
  children?: ReactNode;
}

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "00"],
];

const DEFAULT_QUICK_AMOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100];

function quickActionClass(tone: KeypadQuickAction["tone"]) {
  if (tone === "green") return "bg-green-600";
  if (tone === "blue") return "bg-blue-600";
  if (tone === "orange") return "bg-orange-500";
  return "bg-slate-700 dark:bg-slate-700";
}

export function KeypadAmountModal({
  visible,
  title,
  amount,
  amountLabel,
  confirmLabel,
  cancelLabel = "Cancel",
  quickActions = [],
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  onAmountChange,
  onQuickAmount,
  onConfirm,
  onClose,
  onClear,
  children,
}: KeypadAmountModalProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isTablet = width >= 768;

  const pressKey = (key: string) => {
    onAmountChange(appendAmountKey(amount, key));
  };

  const confirm = () => {
    onConfirm(parseAmountInput(amount));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center bg-black/50 p-3">
        <View className="mx-auto max-h-[94%] w-full max-w-5xl rounded-xl bg-white p-3 dark:bg-slate-900">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className={isTablet ? "flex-row gap-4" : "gap-4"}>
              <View className={isTablet ? "w-[248px]" : "w-full"}>
                <View className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                  <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">
                    {amountLabel}
                  </Text>
                  <Text className="text-right text-3xl font-bold text-slate-900 dark:text-white">
                    ${amount.length > 0 ? amount : "0"}
                  </Text>
                </View>

                <View className="gap-2">
                  {KEYPAD_ROWS.map((row) => (
                    <View key={row.join("-")} className="flex-row gap-2">
                      {row.map((key) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => pressKey(key)}
                          className="min-h-[50px] flex-1 items-center justify-center rounded-lg bg-slate-100 active:bg-slate-200 dark:bg-slate-800"
                        >
                          <Text className="text-xl font-bold text-slate-900 dark:text-white">
                            {key}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => onAmountChange("")}
                      className="min-h-[50px] flex-1 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20"
                    >
                      <Text className="text-base font-bold text-red-600">C</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pressKey("backspace")}
                      className="min-h-[50px] flex-1 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
                    >
                      <Ionicons name="backspace-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="min-w-0 flex-1">
                {quickActions.length > 0 && (
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <TouchableOpacity
                        key={action.label}
                        onPress={action.onPress}
                        className={`min-h-[44px] flex-1 basis-[22%] items-center justify-center rounded-lg px-3 ${quickActionClass(action.tone)}`}
                      >
                        <Text className="text-center text-sm font-bold text-white">
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {children}
              </View>

              {onQuickAmount && (
                <View className={isTablet ? "w-[126px]" : "w-full"}>
                  <View className={isTablet ? "gap-2" : "flex-row flex-wrap gap-2"}>
                    {quickAmounts.map((quickAmount) => (
                      <TouchableOpacity
                        key={quickAmount}
                        onPress={() => onQuickAmount(quickAmount)}
                        className={`${isTablet ? "w-full" : "basis-[23%] flex-1"} min-h-[44px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800`}
                      >
                        <Text className="text-base font-bold text-slate-900 dark:text-white">
                          ${quickAmount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button label={cancelLabel} variant="ghost" onPress={onClear ?? onClose} />
            </View>
            <View className="flex-1">
              <Button label={confirmLabel} onPress={confirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
