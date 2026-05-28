import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

const styles = StyleSheet.create({
  headerCell: {
    borderRightColor: "#e2e8f0",
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  rowCell: {
    borderRightColor: "#e2e8f0",
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 12,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  actionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 38,
  },
});

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
  const tableMinWidth = 760;
  const headerFontSize = 12;
  const bodyFontSize = isTablet ? 14 : 13;
  const numberColumn = 64;
  const orderColumn = isTablet ? 220 : 150;
  const paymentColumn = isTablet ? 190 : 150;
  const amountColumn = 92;
  const dateColumn = 78;
  const actionColumn = 54;
  const tableColumnStyle = { flex: 1, minWidth: isTablet ? 260 : 190 };

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
        horizontal={!isTablet}
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={isTablet ? { width: "100%" } : { minWidth: tableMinWidth }}>
          <View className="flex-row border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <View style={[styles.headerCell, { width: numberColumn }]}>
              <Text className="font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                #
              </Text>
            </View>
            <View style={[styles.headerCell, { width: orderColumn }]}>
              <Text className="font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                {t("revenue.column.orderId")}
              </Text>
            </View>
            <View style={[styles.headerCell, tableColumnStyle]}>
              <Text className="font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                {t("revenue.column.tableType")}
              </Text>
            </View>
            <View style={[styles.headerCell, { width: paymentColumn }]}>
              <Text className="font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                {t("revenue.column.payment")}
              </Text>
            </View>
            <View style={[styles.headerCell, { width: amountColumn }]}>
              <Text className="text-right font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                {t("revenue.column.price")}
              </Text>
            </View>
            <View style={[styles.headerCell, { width: dateColumn }]}>
              <Text className="text-right font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                {t("revenue.column.date")}
              </Text>
            </View>
            <View style={[styles.headerCell, styles.lastCell, { width: actionColumn }]}>
              <Text className="text-center font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
                View
              </Text>
            </View>
          </View>

          {orders.map((order, index) => (
            <View
              key={order.id}
              className={`flex-row border-b border-slate-100 dark:border-slate-800 ${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <View style={[styles.rowCell, { width: numberColumn }]}>
                <Text className="font-medium text-slate-900 dark:text-white" style={{ fontSize: bodyFontSize }}>
                  {index + 1}
                </Text>
              </View>

              <TouchableOpacity onPress={() => onOrderPress(order)} style={[styles.rowCell, { width: orderColumn }]}>
                <Text
                  numberOfLines={1}
                  className="font-bold text-orange-600"
                  style={{ fontSize: bodyFontSize }}
                >
                  #{order.id}
                </Text>
              </TouchableOpacity>

              <View
                style={[styles.rowCell, tableColumnStyle]}
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
                    style={[styles.rowCell, { width: paymentColumn, gap: 6 }]}
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

              <View style={[styles.rowCell, { width: amountColumn }]}>
                <Text className="text-right font-bold text-slate-900 dark:text-white" style={{ fontSize: bodyFontSize }}>
                  ${order.amount.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.rowCell, { width: dateColumn }]}>
                <Text numberOfLines={1} className="text-right text-slate-500" style={{ fontSize: bodyFontSize }}>
                  {order.time}
                </Text>
              </View>

              <View style={[styles.rowCell, styles.lastCell, { width: actionColumn, paddingHorizontal: 8 }]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onOrderPress(order)}
                >
                  <Ionicons name="chevron-forward" size={17} color="#ea580c" />
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
