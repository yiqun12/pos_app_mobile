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
  const tableMinWidth = isTablet ? 860 : 720;
  const headerFontSize = 12;
  const bodyFontSize = isTablet ? 14 : 13;
  const numberColumn = 64;
  const orderColumn = isTablet ? 150 : 132;
  const paymentColumn = isTablet ? 170 : 150;
  const amountColumn = 92;
  const dateColumn = 78;
  const actionColumn = 54;

  const paymentIcon = (channel: string) => {
    const normalized = channel.toLowerCase();
    if (normalized.includes("cash")) return "cash";
    if (normalized.includes("unpaid")) return "alert-circle";
    return "card";
  };

  return (
    <View className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <Text
          className="font-bold text-slate-900 dark:text-white"
          style={{ fontSize: isTablet ? 16 : 15 }}
        >
          {t("revenue.recentTransactions")}
        </Text>
        <View className="rounded-md bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
          <Text className="text-slate-500" style={{ fontSize: isTablet ? 13 : 12 }}>
            {orders.length} orders
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
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ minWidth: tableMinWidth, width: "100%" }}>
          <View className="flex-row border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                { width: numberColumn },
                { fontSize: headerFontSize },
              ]}
              numberOfLines={1}
            >
              #
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                { width: orderColumn },
                { fontSize: headerFontSize },
              ]}
              numberOfLines={1}
            >
              {t("revenue.column.orderId")}
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                { flex: 1, minWidth: isTablet ? 230 : 190, paddingRight: 12 },
                { fontSize: headerFontSize },
              ]}
              numberOfLines={1}
            >
              {t("revenue.column.tableType")}
            </Text>
            <Text
              className="font-bold uppercase text-slate-500"
              style={[
                { width: paymentColumn },
                { fontSize: headerFontSize },
              ]}
              numberOfLines={1}
            >
              {t("revenue.column.payment")}
            </Text>
            <Text
              className="text-right font-bold uppercase text-slate-500"
              style={{ width: amountColumn, fontSize: headerFontSize }}
            >
              {t("revenue.column.price")}
            </Text>
            <Text
              className="text-right font-bold uppercase text-slate-500"
              style={{ width: dateColumn, fontSize: headerFontSize }}
            >
              {t("revenue.column.date")}
            </Text>
            <Text
              className="text-center font-bold uppercase text-slate-500"
              style={{ width: actionColumn, fontSize: headerFontSize }}
            >
              View
            </Text>
          </View>

          {orders.map((order, index) => (
            <View
              key={order.id}
              className={`flex-row items-center border-b border-slate-100 px-3 py-2 dark:border-slate-800 ${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <Text
                className="font-medium text-slate-900 dark:text-white"
                style={[
                  { width: numberColumn },
                  { fontSize: bodyFontSize },
                ]}
              >
                {index + 1}
              </Text>

              <TouchableOpacity onPress={() => onOrderPress(order)} style={{ width: orderColumn }}>
                <Text
                  numberOfLines={1}
                  className="font-bold text-orange-600"
                  style={{ fontSize: bodyFontSize }}
                >
                  #{order.id}
                </Text>
              </TouchableOpacity>

              <View
                style={{ flex: 1, minWidth: isTablet ? 230 : 190, paddingRight: 12 }}
              >
                <Text
                  numberOfLines={1}
                  className="font-medium text-slate-700 dark:text-slate-300"
                  style={{ fontSize: bodyFontSize }}
                >
                  {order.guest}
                </Text>
              </View>

              {(() => {
                const paymentLabel = order.channel || "Unknown";
                return (
                  <View
                    className="flex-row items-center"
                    style={{ width: paymentColumn, gap: 6 }}
                  >
                    <Ionicons name={paymentIcon(paymentLabel)} size={isTablet ? 16 : 14} color="#64748b" />
                    <Text
                      numberOfLines={1}
                      className="text-slate-600 dark:text-slate-400"
                      style={{ fontSize: bodyFontSize }}
                    >
                      {paymentLabel}
                    </Text>
                  </View>
                );
              })()}

              <Text
                className="text-right font-bold text-slate-900 dark:text-white"
                style={{ width: amountColumn, fontSize: bodyFontSize }}
              >
                ${order.amount.toFixed(2)}
              </Text>

              <Text
                numberOfLines={1}
                className="text-right text-slate-500"
                style={{ width: dateColumn, fontSize: bodyFontSize }}
              >
                {order.time}
              </Text>

              <TouchableOpacity
                className="items-center justify-center rounded-md bg-orange-50 p-2 dark:bg-orange-900/20"
                style={{ width: actionColumn }}
                onPress={() => onOrderPress(order)}
              >
                <Ionicons name="chevron-forward" size={16} color="#ea580c" />
              </TouchableOpacity>
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
