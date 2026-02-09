import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { OrderItem } from "../types";

interface OrderItemRowProps {
  item: OrderItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPress: (item: OrderItem) => void;
}

export function OrderItemRow({
  item,
  onIncrement,
  onDecrement,
  onPress,
}: OrderItemRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      className="mb-2 flex-row items-start justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="flex-1">
        <Text
          style={{ fontSize: responsive.baseFontSize }}
          className="font-semibold text-slate-900 dark:text-white"
        >
          {item.name}
        </Text>
        <Text
          style={{ fontSize: responsive.baseFontSize - 2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          ${item.price.toFixed(2)}
        </Text>

        {/* Selected Options */}
        {item.selectedOptions && item.selectedOptions.length > 0 && (
          <View className="mt-2">
            {item.selectedOptions.map((option) => (
              <View key={option.groupId} className="mb-1">
                <Text
                  style={{ fontSize: responsive.captionFontSize }}
                  className="font-medium text-slate-600 dark:text-slate-400"
                >
                  {option.groupName}:{" "}
                  <Text className="font-normal">
                    {option.selectedChoices
                      .map((c) => c.name)
                      .join(", ")}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Selected Ingredients */}
        {item.selectedIngredients && item.selectedIngredients.length > 0 && (
          <View className="mt-1">
            <Text
              style={{ fontSize: responsive.captionFontSize }}
              className="font-medium text-slate-600 dark:text-slate-400"
            >
              Add-ons:{" "}
              <Text className="font-normal">
                {item.selectedIngredients
                  .map((i) => i.name)
                  .join(", ")}
              </Text>
            </Text>
          </View>
        )}

        {/* Selected Global Customizations */}
        {item.selectedGlobalCustomizations && item.selectedGlobalCustomizations.length > 0 && (
          <View className="mt-1 flex-row flex-wrap gap-1">
            {item.selectedGlobalCustomizations.map((customization) => (
              <View
                key={customization.id}
                className={`rounded-full px-2 py-0.5 ${
                  customization.typeCategory === "要求添加"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-orange-100 dark:bg-orange-900/30"
                }`}
              >
                <Text
                  style={{ fontSize: responsive.captionFontSize }}
                  className={`font-medium ${
                    customization.typeCategory === "要求添加"
                      ? "text-green-700 dark:text-green-400"
                      : "text-orange-700 dark:text-orange-400"
                  }`}
                >
                  {customization.type}
                </Text>
              </View>
            ))}
          </View>
        )}

        {item.notes && (
          <Text
            style={{ fontSize: responsive.captionFontSize }}
            className="mt-1 italic text-slate-400"
          >
            {item.notes}
          </Text>
        )}
      </View>

      <View className="ml-3 flex-col items-end gap-3">
        <View className="flex-row items-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <TouchableOpacity
            onPress={() => onDecrement(item.id)}
            className="p-2"
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{ fontSize: responsive.baseFontSize }}
            className="min-w-[20px] text-center font-bold text-slate-900 dark:text-white"
          >
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => onIncrement(item.id)}
            className="p-2"
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text
          style={{ fontSize: responsive.baseFontSize - 2 }}
          className="font-bold text-slate-900 dark:text-white"
        >
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
