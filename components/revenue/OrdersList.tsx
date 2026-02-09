import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ColorMode = (typeof Colors)["light"];

type Order = {
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

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type OrdersListProps = {
  orders: Order[];
  total: string;
  colors: ColorMode;
  onOrderPress: (order: Order) => void;
};

export function OrdersList({
  orders,
  total,
  colors,
  onOrderPress,
}: OrdersListProps) {
  const router = useRouter();
  const responsive = useResponsiveLayout();

  return (
    <View className="gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <Text style={{ fontSize: responsive.subheadingFontSize }} className="font-bold text-slate-900 dark:text-white">
          Orders
        </Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="flex-row items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 dark:bg-blue-600"
            onPress={() => router.push("/analytics")}
          >
            <Ionicons name="analytics" size={responsive.buttonIconSize - 4} color="white" />
            <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="font-semibold text-white">Analytics</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: responsive.baseFontSize }} className="font-bold text-slate-900 dark:text-white">
            ${total}
          </Text>
        </View>
      </View>
      {orders.map((order) => (
        <OrderRow
          key={order.id}
          order={order}
          colors={colors}
          onPress={() => onOrderPress(order)}
        />
      ))}
    </View>
  );
}

function OrderRow({
  order,
  colors,
  onPress,
}: {
  order: Order;
  colors: ColorMode;
  onPress: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="active:bg-slate-100 rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:active:bg-slate-800"
    >
      <View className="flex-row justify-between">
        <Text style={{ fontSize: responsive.baseFontSize }} className="font-bold text-slate-900 dark:text-white">
          {order.id}
        </Text>
        <Text style={{ fontSize: responsive.baseFontSize }} className="font-bold text-slate-900 dark:text-white">
          ${order.amount.toFixed(2)}
        </Text>
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="text-slate-500 dark:text-slate-400">
          {order.guest}
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {order.time} · {order.channel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
