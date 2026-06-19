import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { normalizeAmountInput } from "@/lib/pos/amountInput";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";

interface PaymentModalProps {
  visible: boolean;
  total: number;
  remaining: number;
  onClose: () => void;
  onPayment: (method: "cash" | "card" | "split", amount: number) => void;
  onCashPress?: () => void;
}

export function PaymentModal({
  visible,
  total,
  remaining,
  onClose,
  onPayment,
  onCashPress,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(remaining.toFixed(2));
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      setAmount(remaining.toFixed(2));
    }
  }, [visible, remaining]);

  const handlePay = (method: "cash" | "card" | "split") => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onPayment(method, numAmount);
      onClose(); 
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
      <View className="flex-1 justify-center items-center bg-black/60 p-4">
        <View className="w-full max-w-lg rounded-2xl bg-white p-0 overflow-hidden shadow-2xl dark:bg-slate-900">
          
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {t("seats.payment.title")}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
            {/* Amount Display */}
            <View className="items-center mb-6">
                <Text className="text-slate-500 mb-2 font-medium">
                  {t("seats.payment.amountToPay")}
                </Text>
                <View className="flex-row items-center">
                    <Text className="text-3xl font-bold text-orange-600">$</Text>
                    <TextInput
                        value={amount}
                        onChangeText={(value) => {
                          const normalized = normalizeAmountInput(value);
                          if (normalized !== null) setAmount(normalized);
                        }}
                        keyboardType="decimal-pad"
                        className="ml-1 p-0 text-4xl font-bold text-orange-600"
                        selectTextOnFocus
                    />
                </View>
                <Text className="text-slate-400 mt-2">
                    {t("seats.payment.totalDueRemaining", {
                      total: total.toFixed(2),
                      remaining: (remaining - parseFloat(amount || "0")).toFixed(2),
                    })}
                </Text>
            </View>

            {/* Payment Methods */}
            <View className="gap-3">
                <Button
                    label={t("seats.payment.creditCard")}
                    icon="card"
                    size="lg"
                    className="bg-blue-600 border-blue-600"
                    onPress={() => handlePay("card")}
                />
                <Button
                    label={t("seats.payment.cash")}
                    icon="cash"
                    size="lg"
                    className="bg-green-600 border-green-600"
                    onPress={() => {
                      if (onCashPress) {
                        onClose();
                        onCashPress();
                        return;
                      }
                      handlePay("cash");
                    }}
                />
                <Button
                    label={t("seats.payment.otherMethods")}
                    variant="outline"
                    size="lg"
                    className="border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                />
            </View>
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
