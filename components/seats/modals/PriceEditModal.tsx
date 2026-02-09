import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PriceEditModalProps {
  visible: boolean;
  initialPrice: number;
  itemName: string;
  onClose: () => void;
  onSave: (newPrice: number) => void;
}

export function PriceEditModal({
  visible,
  initialPrice,
  itemName,
  onClose,
  onSave,
}: PriceEditModalProps) {
  const [price, setPrice] = useState(initialPrice.toString());
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice >= 0) {
      onSave(numPrice);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setPrice(initialPrice.toString())}
    >
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Edit Price
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Adjusting price for: <Text className="font-bold">{itemName}</Text>
          </Text>

          <View className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <Text className="mb-1 text-xs font-semibold text-slate-500">
              Price ($)
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              className="text-2xl font-bold text-slate-900 dark:text-white"
              autoFocus
              selectTextOnFocus
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button label="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
