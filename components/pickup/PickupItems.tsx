import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface PickupItemsProps {
  items?: any[];
}

export function PickupItems({ items = [] }: PickupItemsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <>
      <Text className="mb-2 mt-6 text-lg font-semibold text-slate-900 dark:text-white">
        Order Items
      </Text>
      {items.length === 0 ? (
        <View className="items-center justify-center rounded-lg bg-blue-100 py-8 dark:bg-blue-950">
          <Ionicons name="document-text" size={32} color={colors.tint} />
          <Text className="mt-3 text-sm text-slate-900 dark:text-white">
            No items yet
          </Text>
        </View>
      ) : (
        <View>
          <Text className="text-slate-900 dark:text-white">Item list here</Text>
        </View>
      )}
    </>
  );
}
