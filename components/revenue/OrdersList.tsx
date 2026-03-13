import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  const responsive = useResponsiveLayout();
  const isTablet = responsive.isTablet;
  const tableMinWidth = isTablet ? 0 : 760;
  const headerFontSize = isTablet ? 16 : 12;
  const bodyFontSize = isTablet ? 18 : 14;
  const metaFontSize = isTablet ? 15 : 12;
  const actionFontSize = isTablet ? 15 : 12;

  return (
    <View className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
        <Text
          className="font-bold text-slate-900 dark:text-white"
          style={{ fontSize: isTablet ? 30 : 18 }}
        >
          Recent Transactions
        </Text>
        <View className="bg-slate-100 rounded-lg px-3 py-1 dark:bg-slate-800">
            <Text className="text-slate-500" style={{ fontSize: isTablet ? 17 : 14 }}>
              Search orders...
            </Text>
        </View>
      </View>

      <ScrollView
        horizontal={!isTablet}
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={isTablet ? { flex: 1 } : { minWidth: tableMinWidth }}>
          {/* Table Header */}
          <View className="flex-row px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <Text
              className="font-bold text-slate-500 uppercase"
              style={[
                isTablet ? { width: 56 } : { width: 64 },
                { fontSize: headerFontSize },
              ]}
            >
              Number
            </Text>
            <Text
              className="font-bold text-slate-500 uppercase"
              style={[
                isTablet ? { width: 96 } : { width: 96 },
                { fontSize: headerFontSize },
              ]}
            >
              Order ID
            </Text>
            <Text
              className="font-bold text-slate-500 uppercase"
              style={[
                isTablet ? { flex: 1.3, paddingRight: 12 } : { width: 180 },
                { fontSize: headerFontSize },
              ]}
            >
              Table/Type
            </Text>
            <Text
              className="font-bold text-slate-500 uppercase"
              style={[
                isTablet ? { flex: 1 } : { width: 120 },
                { fontSize: headerFontSize },
              ]}
            >
              Payment
            </Text>
            <Text
              className="text-right font-bold text-slate-500 uppercase"
              style={{ width: 88, fontSize: headerFontSize }}
            >
              Price
            </Text>
            <Text
              className="text-right font-bold text-slate-500 uppercase"
              style={{ width: isTablet ? 110 : 96, fontSize: headerFontSize }}
            >
              Date
            </Text>
            <Text
              className="text-center font-bold text-slate-500 uppercase"
              style={{ width: isTablet ? 140 : 116, fontSize: headerFontSize }}
            >
              Actions
            </Text>
          </View>

          {orders.map((order, index) => (
            <View
              key={order.id}
              className={`flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 ${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <Text
                className="text-slate-900 dark:text-white font-medium"
                style={[
                  isTablet ? { width: 56 } : { width: 64 },
                  { fontSize: bodyFontSize },
                ]}
              >
                {index + 1}
              </Text>

              <TouchableOpacity
                onPress={() => onOrderPress(order)}
                style={{ width: 96 }}
              >
                <Text
                  numberOfLines={1}
                  className="text-orange-600 font-bold"
                  style={{ fontSize: bodyFontSize }}
                >
                  #{order.id}
                </Text>
              </TouchableOpacity>

              <View
                style={
                  isTablet
                    ? { flex: 1.3, paddingRight: 12 }
                    : { width: 180, paddingRight: 12 }
                }
              >
                <Text
                  numberOfLines={1}
                  className="font-medium text-slate-700 dark:text-slate-300"
                  style={{ fontSize: bodyFontSize }}
                >
                  {order.guest}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-slate-500 dark:text-slate-400"
                  style={{ fontSize: metaFontSize }}
                >
                  {order.channel}
                </Text>
              </View>

              <View
                className="flex-row items-center"
                style={isTablet ? { flex: 1, gap: 6 } : { width: 120, gap: 6 }}
              >
                <Ionicons name="card" size={isTablet ? 16 : 14} color="#64748b" />
                <Text
                  numberOfLines={1}
                  className="text-slate-600 dark:text-slate-400"
                  style={{ fontSize: bodyFontSize }}
                >
                  Credit Card
                </Text>
              </View>

              <Text
                className="text-right font-bold text-slate-900 dark:text-white"
                style={{ width: 88, fontSize: bodyFontSize }}
              >
                ${order.amount.toFixed(2)}
              </Text>

              <Text
                numberOfLines={1}
                className="text-right text-slate-500"
                style={{ width: isTablet ? 110 : 96, fontSize: bodyFontSize }}
              >
                {order.time}
              </Text>

              <View
                className="flex-row justify-center"
                style={{ width: isTablet ? 140 : 116, gap: 8 }}
              >
                <TouchableOpacity className="bg-slate-100 p-1.5 rounded dark:bg-slate-800">
                  <Text
                    className="font-medium text-slate-600 dark:text-slate-400"
                    style={{ fontSize: actionFontSize }}
                  >
                    Print
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-orange-500 p-1.5 rounded"
                  onPress={() => onOrderPress(order)}
                >
                  <Text className="font-medium text-white" style={{ fontSize: actionFontSize }}>
                    Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
