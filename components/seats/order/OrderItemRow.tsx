import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatTableTimingCartAttributes } from "@/lib/pos/tableTiming";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { OrderItem } from "../types";

interface OrderItemRowProps {
  item: OrderItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete?: (id: string) => void;
  onPress?: (item: OrderItem) => void;
  onEdit?: (item: OrderItem) => void;
}

export function OrderItemRow({
  item,
  onIncrement,
  onDecrement,
  onDelete,
  onPress,
  onEdit,
}: OrderItemRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isSurcharge = item.menuItemId === "SURCHARGE_ITEM";
  const isTableItem = Boolean(item.isTableItem || item.attributeSelected?.["开台商品"]);
  const tableAttributeText = isTableItem
    ? formatTableTimingCartAttributes(item.attributeSelected)
    : "";
  const displayName = isTableItem
    ? (item.nameCN ?? item.rawName ?? item.name)
    : item.name;
  const canOpenTiming = isTableItem && !item.tableTimingEndedAt;
  const isRowDisabled = isSurcharge || (isTableItem && Boolean(item.tableTimingEndedAt));

  return (
    <TouchableOpacity
      activeOpacity={isRowDisabled ? 1 : 0.7}
      onPress={() => onPress?.(item)}
      disabled={isRowDisabled}
      className="mb-3 flex-row items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800"
    >
      {isTableItem && onDelete ? (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          className="mr-3 mt-1 h-8 w-8 items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      ) : (
        <View className="mr-3 h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
      )}

      <View className="flex-1">
        <Text
          style={{ fontSize: responsive.baseFontSize }}
          className="font-semibold text-slate-900 dark:text-white"
        >
          {displayName}
        </Text>
        {!isTableItem && (
          <Text
            style={{ fontSize: responsive.baseFontSize - 2 }}
            className="text-slate-500 dark:text-slate-400"
          >
            ${item.price.toFixed(2)}
          </Text>
        )}
        {tableAttributeText.length > 0 && (
          <Text
            style={{ fontSize: responsive.captionFontSize }}
            className="mt-1 text-slate-600 dark:text-slate-400"
          >
            {tableAttributeText}
          </Text>
        )}

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
              {t("revenue.addOns")}:{" "}
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

        {!isTableItem && item.notes && (
          <Text
            style={{ fontSize: responsive.captionFontSize }}
            className="mt-1 italic text-slate-400"
          >
            {item.notes}
          </Text>
        )}

        {!isSurcharge && !isTableItem && onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(item)}
            activeOpacity={0.75}
            className="mt-2 self-start rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700"
          >
            <View className="flex-row items-center">
              <Ionicons name="create-outline" size={14} color={colors.tint} />
              <Text
                style={{ fontSize: responsive.captionFontSize }}
                className="ml-1 font-semibold text-orange-500 dark:text-orange-400"
              >
                Edit
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {canOpenTiming && onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(item)}
            activeOpacity={0.75}
            className="mt-2 self-start rounded-md border border-red-400 px-3 py-1.5 dark:border-red-500"
          >
            <View className="flex-row items-center">
              <Ionicons name="stop-circle-outline" size={14} color="#f43f5e" />
              <Text
                style={{ fontSize: responsive.captionFontSize }}
                className="ml-1 font-semibold text-rose-500"
              >
                End Table
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View className="ml-3 flex-col items-end gap-3">
        {isSurcharge ? (
          <View className="rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
            <Text
              style={{ fontSize: responsive.captionFontSize }}
              className="font-semibold text-orange-600"
            >
              Surcharge
            </Text>
          </View>
        ) : isTableItem ? (
          <View className="min-h-[34px] min-w-[48px] items-center justify-center rounded-lg bg-slate-100 px-3 dark:bg-slate-800">
            <Text
              style={{ fontSize: responsive.baseFontSize }}
              className="text-center font-bold text-slate-900 dark:text-white"
            >
              {item.quantity}
            </Text>
          </View>
        ) : (
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
        )}

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
