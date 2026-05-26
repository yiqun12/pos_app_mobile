import { SelectedOption } from "@/components/seats/types";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface OrderItemDetailsProps {
  selectedOptions?: SelectedOption[];
  selectedIngredients?: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
  compact?: boolean;
}

/**
 * Displays selected options and ingredients for an order item
 * Can be used in order summaries, receipts, and order details
 */
export function OrderItemDetails({
  selectedOptions,
  selectedIngredients,
  compact = false,
}: OrderItemDetailsProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  if (!selectedOptions?.length && !selectedIngredients?.length) {
    return null;
  }

  return (
    <View className="gap-1">
      {/* Selected Options */}
      {selectedOptions && selectedOptions.length > 0 && (
        <View className="gap-1">
          {selectedOptions.map((option) => (
            <Text
              key={option.groupId}
              style={{
                fontSize: compact
                  ? responsive.captionFontSize - 1
                  : responsive.captionFontSize,
              }}
              className="text-slate-600 dark:text-slate-400"
            >
              <Text className="font-medium">{option.groupName}:</Text>{" "}
              {option.selectedChoices.map((c) => c.name).join(", ")}
            </Text>
          ))}
        </View>
      )}

      {/* Selected Ingredients */}
      {selectedIngredients && selectedIngredients.length > 0 && (
        <Text
          style={{
            fontSize: compact
              ? responsive.captionFontSize - 1
              : responsive.captionFontSize,
          }}
          className="text-slate-600 dark:text-slate-400"
        >
          <Text className="font-medium">{t("seats.orderItemDetails.addOns")}:</Text>{" "}
          {selectedIngredients.map((i) => i.name).join(", ")}
        </Text>
      )}
    </View>
  );
}
