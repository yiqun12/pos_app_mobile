import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

export type Order = {
  id: string;
  guest: string;
  time: string;
  amount: number;
  channel: string;
  items?: OrderItem[];
  subtotal?: number;
  serviceFee?: number;
  tax?: number;
  gratuity?: number;
  total?: number;
};

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderDetailModalProps = {
  visible: boolean;
  order: Order | null;
  colors: ColorMode;
  onClose: () => void;
};

export function OrderDetailModal({
  visible,
  order,
  colors,
  onClose,
}: OrderDetailModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View className="flex-1 pb-4">
          <View className="mt-auto flex-1 rounded-t-2xl bg-white dark:bg-slate-900">
            <OrderDetailContent order={order} colors={colors} onClose={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function OrderDetailContent({
  order,
  colors,
  onClose,
  onPay,
}: {
  order: Order | null;
  colors: ColorMode;
  onClose: () => void;
  onPay?: () => void;
}) {
  const { t } = useTranslation();

  if (!order) return null;

  return (
    <View className="flex-1">
      <View className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {t("revenue.orderDetails")}
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {order.id}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <View className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
          <View className="flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("revenue.guest")}
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.guest}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("revenue.time")}
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.time}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("revenue.channel")}
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.channel}
            </Text>
          </View>
        </View>

        {order.items && order.items.length > 0 && (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
              {t("revenue.items")}
            </Text>
            {order.items.map((item, idx) => (
              <View
                key={idx}
                className="mb-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
              >
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("revenue.itemQtyPrice", {
                        quantity: item.quantity,
                        price: item.price.toFixed(2),
                      })}
                    </Text>

                    {(item as any).selectedOptions &&
                      (item as any).selectedOptions.length > 0 && (
                        <View className="mt-2">
                          {(item as any).selectedOptions.map(
                            (option: any, optIdx: number) => (
                              <Text
                                key={optIdx}
                                className="text-xs text-slate-600 dark:text-slate-400"
                              >
                                {option.groupName}: {option.selectedChoices
                                  .map((c: any) => c.name)
                                  .join(", ")}
                              </Text>
                            )
                          )}
                        </View>
                      )}

                    {(item as any).selectedIngredients &&
                      (item as any).selectedIngredients.length > 0 && (
                        <Text className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {t("revenue.addOns")}: {(item as any).selectedIngredients
                            .map((i: any) => i.name)
                            .join(", ")}
                        </Text>
                      )}
                  </View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    ${item.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {order.subtotal && (
          <View className="mb-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <View className="flex-row justify-between py-2">
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                {t("revenue.subtotal")}
              </Text>
              <Text className="font-semibold text-slate-900 dark:text-white">
                ${order.subtotal.toFixed(2)}
              </Text>
            </View>
            {order.serviceFee !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  {t("revenue.serviceFee")}
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.serviceFee.toFixed(2)}
                </Text>
              </View>
            )}
            {order.tax !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  {t("revenue.tax")}
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.tax.toFixed(2)}
                </Text>
              </View>
            )}
            {order.gratuity !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  {t("revenue.gratuity")}
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.gratuity.toFixed(2)}
                </Text>
              </View>
            )}
            {order.total && (
              <View className="mt-2 flex-row justify-between border-t border-slate-200 py-2 dark:border-slate-700">
                <Text className="font-bold text-slate-900 dark:text-white">
                  {t("revenue.total")}
                </Text>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${order.total.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {(!order.items || order.items.length === 0) && !order.subtotal && (
          <View className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
              {t("revenue.detailUnavailable")}
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 rounded-lg bg-slate-100 py-3 dark:bg-slate-800"
        >
          <Text className="text-center font-bold text-slate-900 dark:text-white">
            {t("common.close")}
          </Text>
        </TouchableOpacity>

        {onPay && (
          <TouchableOpacity
            onPress={onPay}
            className="flex-1 rounded-lg bg-blue-600 py-3"
          >
            <Text className="text-center font-bold text-white">
              {t("revenue.payAmount", {
                amount: (order.total || order.amount || 0).toFixed(2),
              })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
