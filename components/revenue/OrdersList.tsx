import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onOrderPress: (order: Order) => void;
  onLoadMore?: () => void;
};

export function OrdersList({
  orders,
  total,
  colors,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onOrderPress,
  onLoadMore,
}: OrdersListProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const tableMinWidth = isTablet ? 0 : 760;
  const headerFontSize = isTablet ? 16 : 12;
  const bodyFontSize = isTablet ? 18 : 14;
  const metaFontSize = isTablet ? 15 : 12;
  const actionFontSize = isTablet ? 15 : 12;

  return (
    <View className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Text
          className="font-bold text-slate-900 dark:text-white"
          style={{ fontSize: isTablet ? 30 : 18 }}
        >
          {t("revenue.recentTransactions")}
        </Text>
        <View className="rounded-lg bg-slate-100 px-3 py-1 dark:bg-slate-800">
          <Text className="text-slate-500" style={{ fontSize: isTablet ? 17 : 14 }}>
            {t("revenue.searchOrders")}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading orders...
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="receipt-outline" size={40} color="#94a3b8" />
          <Text className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            No orders found
          </Text>
        </View>
      ) : (
      <ScrollView
        horizontal={!isTablet}
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={isTablet ? { flex: 1 } : { minWidth: tableMinWidth }}>
          <View className="flex-row border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                isTablet ? { width: 56 } : { width: 64 },
                { fontSize: headerFontSize },
              ]}
            >
              {t("revenue.column.number")}
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                isTablet ? { width: 96 } : { width: 96 },
                { fontSize: headerFontSize },
              ]}
            >
              {t("revenue.column.orderId")}
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                isTablet ? { flex: 1.3, paddingRight: 12 } : { width: 180 },
                { fontSize: headerFontSize },
              ]}
            >
              {t("revenue.column.tableType")}
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                isTablet ? { flex: 1 } : { width: 120 },
                { fontSize: headerFontSize },
              ]}
            >
              {t("revenue.column.payment")}
            </Text>
            <Text
              className="text-right font-bold uppercase text-slate-500"
              style={{ width: 88, fontSize: headerFontSize }}
            >
              {t("revenue.column.price")}
            </Text>
            <Text
              className="text-right font-bold uppercase text-slate-500"
              style={{ width: isTablet ? 110 : 96, fontSize: headerFontSize }}
            >
              {t("revenue.column.date")}
            </Text>
            <Text
              className="text-center font-bold uppercase text-slate-500"
              style={{ width: isTablet ? 140 : 116, fontSize: headerFontSize }}
            >
              {t("revenue.column.actions")}
            </Text>
          </View>

          {orders.map((order, index) => (
            <View
              key={order.id}
              className={`flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800 ${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <Text
                className="font-medium text-slate-900 dark:text-white"
                style={[
                  isTablet ? { width: 56 } : { width: 64 },
                  { fontSize: bodyFontSize },
                ]}
              >
                {index + 1}
              </Text>

              <TouchableOpacity onPress={() => onOrderPress(order)} style={{ width: 96 }}>
                <Text
                  numberOfLines={1}
                  className="font-bold text-orange-600"
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
                  {t("revenue.creditCard")}
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
                <TouchableOpacity className="rounded bg-slate-100 p-1.5 dark:bg-slate-800">
                  <Text
                    className="font-medium text-slate-600 dark:text-slate-400"
                    style={{ fontSize: actionFontSize }}
                  >
                    {t("revenue.print")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="rounded bg-orange-500 p-1.5"
                  onPress={() => onOrderPress(order)}
                >
                  <Text className="font-medium text-white" style={{ fontSize: actionFontSize }}>
                    {t("revenue.details")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {(hasMore || loadingMore) && (
            <View className="items-center border-t border-slate-100 px-4 py-4 dark:border-slate-800">
              {loadingMore ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.tint} />
                  <Text className="font-medium text-slate-500 dark:text-slate-400">
                    Loading more...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={onLoadMore}
                  className="rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800"
                >
                  <Text className="font-semibold text-slate-700 dark:text-slate-200">
                    Load more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      )}
    </View>
  );
}
