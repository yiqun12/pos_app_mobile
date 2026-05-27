import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ServiceFeeModalProps {
  visible: boolean;
  baseAmount: number;
  currentAmount: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const QUICK_PERCENTAGES = [0.15, 0.18, 0.2, 0.25];

function parseMoneyInput(value: string): number | null {
  const normalized = value.replace(/。/g, ".").trim();
  if (!/^\d*\.?\d*$/.test(normalized)) return null;
  if (normalized.length === 0 || normalized === ".") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export function ServiceFeeModal({
  visible,
  baseAmount,
  currentAmount,
  onClose,
  onConfirm,
}: ServiceFeeModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (visible) setAmount(currentAmount > 0 ? currentAmount.toFixed(2) : "");
  }, [currentAmount, visible]);

  const handleAmountChange = (value: string) => {
    const normalized = value.replace(/。/g, ".");
    if (/^\d*\.?\d*$/.test(normalized)) setAmount(normalized);
  };

  const applyPercent = (percent: number) => {
    setAmount((Math.max(0, baseAmount) * percent).toFixed(2));
  };

  const handleConfirm = () => {
    const parsed = parseMoneyInput(amount);
    if (parsed === null) return;
    onConfirm(Math.round(parsed * 100) / 100);
    onClose();
  };

  const handleCancelAdd = () => {
    onConfirm(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Add Service Fee
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="mb-4 flex-row gap-2">
            {QUICK_PERCENTAGES.map((percent) => (
              <TouchableOpacity
                key={percent}
                onPress={() => applyPercent(percent)}
                className="flex-1 rounded-lg bg-green-600 px-2 py-3"
              >
                <Text className="text-center font-semibold text-white">
                  {(percent * 100).toFixed(0)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <Text className="mb-1 text-xs font-semibold text-slate-500">
              Service fee amount
            </Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="Enter service fee by amount"
              placeholderTextColor="#94a3b8"
              className="text-2xl font-bold text-slate-900 dark:text-white"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Cancel Add" variant="ghost" onPress={handleCancelAdd} />
            </View>
            <View className="flex-1">
              <Button label="Add Service Fee" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
