import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PaymentModalProps {
  visible: boolean;
  total: number;
  remaining: number;
  onClose: () => void;
  onPayment: (method: "cash" | "card" | "split", amount: number) => void;
}

export function PaymentModal({
  visible,
  total,
  remaining,
  onClose,
  onPayment,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

  const handlePay = (method: "cash" | "card" | "split") => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onPayment(method, numAmount);
      onClose(); // In a real app we might wait for success
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={() => setAmount(remaining.toFixed(2))}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text style={{ fontSize: responsive.headingFontSize }} className="font-bold text-slate-900 dark:text-white">
                Payment
              </Text>
              <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="text-slate-500">
                Total Due: ${total.toFixed(2)} | Remaining: $
                {remaining.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="mb-8 items-center">
            <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="mb-2 text-slate-500">Amount to Pay</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: responsive.headingFontSize }} className="font-bold text-slate-900 dark:text-white">
                $
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={{ fontSize: responsive.headingFontSize + 4 }}
                className="ml-1 font-bold text-slate-900 dark:text-white"
                selectTextOnFocus
              />
            </View>
          </View>

          <View className="gap-4 mb-8">
            <Button
              label={`Pay Cash $${amount}`}
              icon="cash"
              size="lg"
              className="bg-green-600"
              onPress={() => handlePay("cash")}
            />
            <Button
              label={`Pay Card $${amount}`}
              icon="card"
              size="lg"
              className="bg-blue-600"
              onPress={() => handlePay("card")}
            />
            <Button
              label="Split Payment"
              variant="outline"
              icon="pie-chart"
              size="lg"
              onPress={() => handlePay("split")}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
