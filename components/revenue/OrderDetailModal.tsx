import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
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
            <OrderDetailContent
              order={order}
              colors={colors}
              onClose={onClose}
            />
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
  if (!order) return null;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Order Details
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

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4">
        {/* Order Meta */}
        <View className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
          <View className="flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Guest
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.guest}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Time
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.time}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Channel
            </Text>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {order.channel}
            </Text>
          </View>
        </View>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
              Items
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
                      {item.quantity}x @ ${item.price.toFixed(2)}
                    </Text>

                    {/* Display selected options if available */}
                    {(item as any).selectedOptions &&
                      (item as any).selectedOptions.length > 0 && (
                        <View className="mt-2">
                          {(item as any).selectedOptions.map(
                            (option: any, optIdx: number) => (
                              <Text
                                key={optIdx}
                                className="text-xs text-slate-600 dark:text-slate-400"
                              >
                                {option.groupName}:{" "}
                                {option.selectedChoices
                                  .map((c: any) => c.name)
                                  .join(", ")}
                              </Text>
                            )
                          )}
                        </View>
                      )}

                    {/* Display selected ingredients if available */}
                    {(item as any).selectedIngredients &&
                      (item as any).selectedIngredients.length > 0 && (
                        <Text className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          Add-ons:{" "}
                          {(item as any).selectedIngredients
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

        {/* Breakdown */}
        {order.subtotal && (
          <View className="mb-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <View className="flex-row justify-between py-2">
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                Subtotal
              </Text>
              <Text className="font-semibold text-slate-900 dark:text-white">
                ${order.subtotal.toFixed(2)}
              </Text>
            </View>
            {order.serviceFee !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  Service fee
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.serviceFee.toFixed(2)}
                </Text>
              </View>
            )}
            {order.tax !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  Tax
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.tax.toFixed(2)}
                </Text>
              </View>
            )}
            {order.gratuity !== undefined && (
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  Gratuity
                </Text>
                <Text className="font-semibold text-slate-900 dark:text-white">
                  ${order.gratuity.toFixed(2)}
                </Text>
              </View>
            )}
            {order.total && (
              <View className="mt-2 border-t border-slate-200 flex-row justify-between py-2 dark:border-slate-700">
                <Text className="font-bold text-slate-900 dark:text-white">
                  Total
                </Text>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${order.total.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Simple Display */}
        {(!order.items || order.items.length === 0) && !order.subtotal && (
          <View className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
              Detailed order information not available
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-slate-200 px-4 py-3 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 rounded-lg bg-slate-100 py-3 dark:bg-slate-800"
        >
          <Text className="text-center font-bold text-slate-900 dark:text-white">
            Close
          </Text>
        </TouchableOpacity>

        {onPay && (
          <TouchableOpacity
            onPress={onPay}
            className="flex-1 rounded-lg bg-blue-600 py-3"
          >
            <Text className="text-center font-bold text-white">
              Pay ${(order.total || order.amount || 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
