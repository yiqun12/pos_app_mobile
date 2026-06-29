import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  formatOrderSectionDayLabel,
  formatOrderSectionTime,
  getOrderSectionDayKey,
} from "@/lib/pos/revenueBusinessDay";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ColorMode = (typeof Colors)["light"];

type Order = {
  id: string;
  guest: string;
  time: string;
  dateTime?: string;
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

function formatOrderDate(order: Order, groupedByDay = false): string {
  if (groupedByDay) {
    return formatOrderSectionTime(order.dateTime, order.time);
  }

  if (!order.dateTime) return order.time;

  const parts = order.dateTime.split("-");
  if (parts.length < 5) return order.time || order.dateTime;

  const [year, month, day, hour, minute] = parts;
  return `${month}/${day}/${year} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

type OrderListEntry =
  | { type: "header"; dayKey: string; label: string }
  | { type: "order"; order: Order; groupedByDay: boolean };

function buildOrderListEntries(orders: Order[], locale: string): OrderListEntry[] {
  const entries: OrderListEntry[] = [];
  let previousDayKey: string | null = null;

  orders.forEach((order) => {
    const dayKey = getOrderSectionDayKey(order.dateTime);
    const groupedByDay = dayKey !== "unknown";
    if (dayKey !== previousDayKey) {
      entries.push({
        type: "header",
        dayKey,
        label: formatOrderSectionDayLabel(dayKey, locale),
      });
      previousDayKey = dayKey;
    }
    entries.push({ type: "order", order, groupedByDay });
  });

  return entries;
}

function OrderDateSectionHeader({
  label,
  isFirst = false,
}: {
  label: string;
  isFirst?: boolean;
}) {
  const responsive = useResponsiveLayout();

  return (
    <View className={isFirst ? "mb-3 mt-1" : "mb-3 mt-6"}>
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <View className="flex-row items-center gap-2 px-1">
          <Ionicons name="calendar-outline" size={15} color="#ea580c" />
          <Text
            className="font-semibold text-slate-700 dark:text-slate-200"
            style={{ fontSize: responsive.captionFontSize + 1 }}
          >
            {label}
          </Text>
        </View>
        <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </View>
    </View>
  );
}

function paymentIcon(channel: string): keyof typeof Ionicons.glyphMap {
  const normalized = channel.toLowerCase();
  if (normalized.includes("cash")) return "cash-outline";
  if (normalized.includes("unpaid")) return "alert-circle-outline";
  return "card-outline";
}

function isOrderUnpaid(channel: string): boolean {
  return channel.toLowerCase().includes("unpaid");
}

function getGratuityPercent(order: Order): number | null {
  const subtotal = order.subtotal ?? 0;
  if (subtotal <= 0) return null;

  const serviceFee = order.serviceFee ?? 0;
  const tips = order.gratuity ?? 0;
  const percentage =
    serviceFee === 0 ? (tips / subtotal) * 100 : (serviceFee / subtotal) * 100;

  if (!Number.isFinite(percentage)) return null;
  return percentage;
}

function GuestLabel({
  guest,
  fontSize,
  className = "",
}: {
  guest: string;
  fontSize: number;
  className?: string;
}) {
  const tablePrefix = "Table ";
  if (guest.startsWith(tablePrefix)) {
    return (
      <Text
        numberOfLines={1}
        className={`text-slate-700 dark:text-slate-300 ${className}`}
        style={{ fontSize }}
      >
        <Text>{tablePrefix}</Text>
        <Text className="font-bold">{guest.slice(tablePrefix.length)}</Text>
      </Text>
    );
  }

  return (
    <Text
      numberOfLines={1}
      className={`font-bold text-slate-700 dark:text-slate-300 ${className}`}
      style={{ fontSize }}
    >
      {guest}
    </Text>
  );
}

function OrderPriceBlock({
  order,
  fontSize,
  align = "right",
}: {
  order: Order;
  fontSize: number;
  align?: "right" | "center";
}) {
  const { t } = useTranslation();
  const unpaid = isOrderUnpaid(order.channel || "");
  const priceColor = unpaid ? "text-red-600" : "text-green-600";
  const displayAmount = order.total ?? order.amount;
  const gratuityPercent = getGratuityPercent(order);
  const alignClass = align === "center" ? "items-center" : "items-end";

  return (
    <View className={alignClass}>
      <Text
        className={`font-bold ${priceColor}`}
        style={{ fontSize: fontSize + (align === "right" ? 2 : 0) }}
      >
        ${displayAmount.toFixed(2)}
      </Text>
      {gratuityPercent !== null ? (
        <Text
          className="mt-0.5 font-medium text-red-600"
          style={{ fontSize: fontSize - 2 }}
        >
          {t("revenue.gratuityPercentShort", {
            percent: gratuityPercent.toFixed(2),
          })}
        </Text>
      ) : null}
    </View>
  );
}

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
  centerCell: {
    alignItems: "center",
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

type LoadMoreFooterProps = {
  colors: ColorMode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  compact?: boolean;
};

function LoadMoreFooter({
  colors,
  hasMore,
  loadingMore,
  onLoadMore,
  compact = false,
}: LoadMoreFooterProps) {
  const { t } = useTranslation();

  if (!hasMore && !loadingMore) return null;

  return (
    <View
      className={`items-center ${compact ? "pt-2" : "border-t border-slate-100 px-4 py-4 dark:border-slate-800"}`}
    >
      {loadingMore ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color={colors.tint} />
          <Text className="font-medium text-slate-500 dark:text-slate-400">
            {t("revenue.loadingMore")}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onLoadMore}
          className="rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800"
        >
          <Text className="font-semibold text-slate-700 dark:text-slate-200">
            {t("revenue.loadMore")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type OrderCardProps = {
  order: Order;
  groupedByDay?: boolean;
  onPress: (order: Order) => void;
};

function OrderCard({ order, groupedByDay = false, onPress }: OrderCardProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const paymentLabel = order.channel || t("revenue.unknownPayment");

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(order)}
      className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-bold text-orange-600"
            style={{ fontSize: responsive.baseFontSize }}
          >
            #{order.id}
          </Text>
          <GuestLabel
            guest={order.guest}
            fontSize={responsive.baseFontSize - 1}
            className="mt-1"
          />
        </View>
        <OrderPriceBlock order={order} fontSize={responsive.baseFontSize} />
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Ionicons name={paymentIcon(paymentLabel)} size={16} color="#64748b" />
          <Text
            numberOfLines={1}
            className="flex-1 text-slate-600 dark:text-slate-400"
            style={{ fontSize: responsive.captionFontSize }}
          >
            {paymentLabel}
          </Text>
        </View>
        <View className="ml-2 flex-row items-center gap-1">
          <Text
            numberOfLines={1}
            className="text-slate-500 dark:text-slate-400"
            style={{ fontSize: responsive.captionFontSize }}
          >
            {formatOrderDate(order, groupedByDay)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

type OrdersTableProps = {
  orders: Order[];
  colors: ColorMode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onOrderPress: (order: Order) => void;
  onLoadMore?: () => void;
};

function OrdersTable({
  orders,
  colors,
  hasMore,
  loadingMore,
  onOrderPress,
  onLoadMore,
}: OrdersTableProps) {
  const { t, i18n } = useTranslation();
  const headerFontSize = 12;
  const bodyFontSize = 14;
  const numberColumn = 52;
  const orderColumn = 128;
  const amountColumn = 108;
  const dateColumn = 166;
  const actionColumn = 66;
  const tableColumnStyle = { flex: 0.75, minWidth: 150 };
  const paymentColumnStyle = { flex: 0.85, minWidth: 170 };
  const entries = buildOrderListEntries(orders, i18n.language);
  let rowNumber = 0;

  return (
    <View style={{ width: "100%" }}>
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
        <View style={[styles.headerCell, styles.centerCell, paymentColumnStyle]}>
          <Text className="text-center font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
            {t("revenue.column.payment")}
          </Text>
        </View>
        <View style={[styles.headerCell, styles.centerCell, { width: amountColumn }]}>
          <Text className="text-center font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
            {t("revenue.column.price")}
          </Text>
        </View>
        <View style={[styles.headerCell, styles.centerCell, { width: dateColumn }]}>
          <Text className="text-center font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
            {t("revenue.column.date")}
          </Text>
        </View>
        <View style={[styles.headerCell, styles.centerCell, styles.lastCell, { width: actionColumn }]}>
          <Text className="text-center font-bold uppercase text-slate-500" style={{ fontSize: headerFontSize }} numberOfLines={1}>
            {t("revenue.column.actions")}
          </Text>
        </View>
      </View>

      {entries.map((entry, index) => {
        if (entry.type === "header") {
          return (
            <View
              key={`header-${entry.dayKey}-${index}`}
              className="border-b border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/80"
            >
              <OrderDateSectionHeader
                label={entry.label}
                isFirst={index === 0}
              />
            </View>
          );
        }

        const order = entry.order;
        rowNumber += 1;

        return (
        <View
          key={order.id}
          className={`flex-row border-b border-slate-100 dark:border-slate-800 ${
            rowNumber % 2 === 0
              ? "bg-white dark:bg-slate-900"
              : "bg-slate-50/50 dark:bg-slate-900/50"
          }`}
        >
          <View style={[styles.rowCell, { width: numberColumn }]}>
            <Text className="font-medium text-slate-900 dark:text-white" style={{ fontSize: bodyFontSize }}>
              {rowNumber}
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

          <View style={[styles.rowCell, tableColumnStyle]}>
            <GuestLabel guest={order.guest} fontSize={bodyFontSize} />
          </View>

          <View
            className="flex-row items-center"
            style={[styles.rowCell, paymentColumnStyle, { gap: 6 }]}
          >
            <Ionicons name={paymentIcon(order.channel || "")} size={16} color="#64748b" />
            <Text
              numberOfLines={1}
              className="text-slate-600 dark:text-slate-400"
              style={{ fontSize: bodyFontSize }}
            >
              {order.channel || t("revenue.unknownPayment")}
            </Text>
          </View>

          <View style={[styles.rowCell, styles.centerCell, { width: amountColumn }]}>
            <OrderPriceBlock order={order} fontSize={bodyFontSize} align="center" />
          </View>

          <View style={[styles.rowCell, styles.centerCell, { width: dateColumn }]}>
            <Text numberOfLines={1} className="text-center text-slate-500" style={{ fontSize: bodyFontSize }}>
              {formatOrderDate(order, entry.groupedByDay)}
            </Text>
          </View>

          <View style={[styles.rowCell, styles.centerCell, styles.lastCell, { width: actionColumn, paddingHorizontal: 8 }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onOrderPress(order)}
            >
              <Ionicons name="chevron-forward" size={17} color="#ea580c" />
            </TouchableOpacity>
          </View>
        </View>
        );
      })}

      <LoadMoreFooter
        colors={colors}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    </View>
  );
}

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
  const { t, i18n } = useTranslation();
  const isTablet = responsive.isTablet;
  const entries = buildOrderListEntries(orders, i18n.language);

  return (
    <View className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <Text
          className="font-bold text-slate-900 dark:text-white"
          style={{ fontSize: isTablet ? 16 : 15 }}
        >
          {t("revenue.recentTransactions")}
        </Text>
        <View className="rounded-md bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
          <Text className="text-slate-500" style={{ fontSize: isTablet ? 13 : 12 }}>
            {t("revenue.ordersCount", { count: orders.length })}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("revenue.loadingOrders")}
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="receipt-outline" size={40} color="#94a3b8" />
          <Text className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("revenue.noOrders")}
          </Text>
        </View>
      ) : isTablet ? (
        <OrdersTable
          orders={orders}
          colors={colors}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onOrderPress={onOrderPress}
          onLoadMore={onLoadMore}
        />
      ) : (
        <View className="px-3 pb-3 pt-3">
          {entries.map((entry, index) =>
            entry.type === "header" ? (
              <OrderDateSectionHeader
                key={`header-${entry.dayKey}-${index}`}
                label={entry.label}
                isFirst={index === 0}
              />
            ) : (
              <OrderCard
                key={entry.order.id}
                order={entry.order}
                groupedByDay={entry.groupedByDay}
                onPress={onOrderPress}
              />
            )
          )}
          <LoadMoreFooter
            colors={colors}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
            compact
          />
        </View>
      )}
    </View>
  );
}
