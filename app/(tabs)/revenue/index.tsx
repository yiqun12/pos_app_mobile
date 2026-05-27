import { StatCard } from "@/components/analytics/StatCard";
import { DateRangeSelector } from "@/components/revenue/DateRangeSelector";
import { OrderDetailModal } from "@/components/revenue/OrderDetailModal";
import { OrdersList } from "@/components/revenue/OrdersList";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useModalAction } from "@/hooks/useModalAction";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { db } from "@/lib/firebase";
import {
  parseReceiptItems,
  type RevenueOrderSummary,
  summarizeCashDrawer,
  summarizeItemSales,
  transformSuccessPaymentSummary,
} from "@/lib/pos/revenueTransforms";
import { sliceRevenuePage } from "@/lib/pos/revenuePagination";
import {
  collection,
  type DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import {
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  dateTime?: string;
  receiptData?: string;
};

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

function parseDateToFirestoreString(dateStr: string, isEnd: boolean): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const month = parts[0].padStart(2, "0");
  const day = parts[1].padStart(2, "0");
  const year = parts[2];
  
  if (isEnd) {
    return `${year}-${month}-${day}-23-59-59-99`;
  } else {
    return `${year}-${month}-${day}-00-00-00-00`;
  }
}

const todayStr = (() => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
})();

const DEFAULT_RANGE = {
  startDate: todayStr,
  endDate: todayStr,
};

const INITIAL_ORDERS: Order[] = [];
const REVENUE_PAGE_SIZE = 100;

export default function RevenueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const isPhone = !responsive.isTablet;
  const tabFontSize = responsive.isTablet ? 17 : 14;
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();

  const PRESETS = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const getMonthRange = (year: number, monthZeroIndexed: number) => {
      const start = new Date(year, monthZeroIndexed, 1);
      const end = new Date(year, monthZeroIndexed + 1, 0);
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      };
    };

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthLabel = today.toLocaleString("default", { month: "long" });
    const lastMonthLabel = new Date(lastMonthYear, lastMonth, 1).toLocaleString("default", { month: "long" });

    return [
      {
        label: t("revenue.preset.today"),
        startDate: formatDate(today),
        endDate: formatDate(today),
      },
      {
        label: t("revenue.preset.yesterday"),
        startDate: formatDate(yesterday),
        endDate: formatDate(yesterday),
      },
      {
        label: currentMonthLabel,
        ...getMonthRange(currentYear, currentMonth),
      },
      {
        label: lastMonthLabel,
        ...getMonthRange(lastMonthYear, lastMonth),
      },
    ];
  }, [t]);

  const tabs = useMemo(
    () => [
      t("revenue.tab.allOrders"),
      t("revenue.tab.cashDrawer"),
      t("revenue.tab.salesAnalysis"),
    ] as const,
    [t]
  );

  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    t("revenue.preset.today")
  );
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [lastOrderDoc, setLastOrderDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const fetchRevenuePage = React.useCallback(async ({
    append = false,
    afterDoc = null,
  }: {
    append?: boolean;
    afterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  } = {}) => {
    if (!user || !currentStoreId) return;

    const startStr = parseDateToFirestoreString(dateRange.startDate, false);
    const endStr = parseDateToFirestoreString(dateRange.endDate, true);

    if (!append) setLoadingOrders(true);
    else setLoadingMoreOrders(true);

    try {
      const colRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment");
      const constraints: QueryConstraint[] = [
        where("dateTime", ">=", startStr),
        where("dateTime", "<=", endStr),
        orderBy("dateTime", "desc"),
      ];

      if (afterDoc) constraints.push(startAfter(afterDoc));
      constraints.push(limit(REVENUE_PAGE_SIZE + 1));

      const snapshot = await getDocs(query(colRef, ...constraints));
      const page = sliceRevenuePage(snapshot.docs, REVENUE_PAGE_SIZE);
      const fetched: Order[] = page.rows.map((docSnap) => {
        const data = docSnap.data();
        return transformSuccessPaymentSummary(docSnap.id, data);
      });

      setOrders((prev) => append ? [...prev, ...fetched] : fetched);
      setLastOrderDoc(page.rows[page.rows.length - 1] ?? null);
      setHasMoreOrders(page.hasMore);
    } catch (err) {
      console.error("Error loading success_payment:", err);
      if (!append) setOrders([]);
      Alert.alert(t("common.error"), "Failed to load revenue orders");
    } finally {
      if (!append) setLoadingOrders(false);
      else setLoadingMoreOrders(false);
    }
  }, [currentStoreId, dateRange.endDate, dateRange.startDate, t, user]);

  // Load from Firestore success_payment
  useEffect(() => {
    setOrders([]);
    setLastOrderDoc(null);
    setHasMoreOrders(false);
    void fetchRevenuePage();
  }, [fetchRevenuePage]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let netSales = 0;
    let tax = 0;
    let tips = 0;

    orders.forEach((o) => {
      totalRevenue += o.total ?? o.amount ?? 0;
      netSales += o.subtotal ?? 0;
      tax += o.tax ?? 0;
      tips += o.gratuity ?? 0;
    });

    return {
      totalRevenue: totalRevenue.toFixed(2),
      netSales: netSales.toFixed(2),
      tax: tax.toFixed(2),
      tips: tips.toFixed(2),
    };
  }, [orders]);

  const total = stats.totalRevenue;
  const cashDrawerSummary = useMemo(() => summarizeCashDrawer(orders as RevenueOrderSummary[]), [orders]);
  const itemSales = useMemo(() => summarizeItemSales(orders as RevenueOrderSummary[]).slice(0, 20), [orders]);

  const handlePreset = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setSelectedPreset(label);
    setDateRange({ startDate: preset.startDate, endDate: preset.endDate });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRevenuePage();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMoreOrders = () => {
    if (!lastOrderDoc || !hasMoreOrders || loadingOrders || loadingMoreOrders) return;
    void fetchRevenuePage({ append: true, afterDoc: lastOrderDoc });
  };

  const handleRevenueScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeTab !== tabs[0]) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom < 180) handleLoadMoreOrders();
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder({
      ...order,
      items: order.items ?? parseReceiptItems(order.receiptData),
    });
    setOrderModalVisible(true);
  };

  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  useModalAction((modalName) => {
    if (modalName === "orderDetail") {
      if (orderId) {
        const targetOrder = orders.find((o) => o.id === orderId);
        if (targetOrder) {
          setSelectedOrder({
            ...targetOrder,
            items: targetOrder.items ?? parseReceiptItems(targetOrder.receiptData),
          });
          setOrderModalVisible(true);
        } else {
          Alert.alert(t("common.error"), t("revenue.orderNotFound", { orderId }));
        }
      } else if (orders.length > 0) {
        setSelectedOrder({
          ...orders[0],
          items: orders[0].items ?? parseReceiptItems(orders[0].receiptData),
        });
        setOrderModalVisible(true);
      }
    }
  });

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("revenue.title")}
        subtitle={t("revenue.subtitle")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: responsive.mediumSpacing,
          padding: responsive.mediumSpacing,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleRevenueScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
      >
        <DateRangeSelector
          dateRange={dateRange}
          selectedPreset={selectedPreset}
          presets={PRESETS}
          colors={colors}
          onPresetSelect={handlePreset}
          onDateChange={(range) => {
            setDateRange(range);
            setSelectedPreset(null);
          }}
        />

        {isPhone ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ gap: responsive.baseSpacing }}
          >
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.totalRevenue")} value={`$${stats.totalRevenue}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.netSales")} value={`$${stats.netSales}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.tax")} value={`$${stats.tax}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.totalTips")} value={`$${stats.tips}`} />
            </View>
          </ScrollView>
        ) : (
          <View className="flex-row gap-4">
            <View className="flex-1">
              <StatCard title={t("revenue.totalRevenue")} value={`$${stats.totalRevenue}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.netSales")} value={`$${stats.netSales}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.tax")} value={`$${stats.tax}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.totalTips")} value={`$${stats.tips}`} />
            </View>
          </View>
        )}

        <ScrollView
          horizontal={isPhone}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{
            gap: responsive.smallSpacing,
            borderBottomWidth: 1,
            borderBottomColor: colorScheme === "dark" ? "#1e293b" : "#e2e8f0",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 ${
                  isActive ? "border-orange-500" : "border-transparent"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`font-semibold ${
                    isActive ? "text-orange-600" : "text-slate-500"
                  }`}
                  style={{ fontSize: tabFontSize }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === tabs[0] && (
          <OrdersList
            orders={orders}
            total={total}
            colors={colors}
            loading={loadingOrders}
            loadingMore={loadingMoreOrders}
            hasMore={hasMoreOrders}
            onOrderPress={handleOrderPress}
            onLoadMore={handleLoadMoreOrders}
          />
        )}

        {activeTab === tabs[1] && (
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              {t("revenue.cashDrawer")}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {[
                ["Orders", cashDrawerSummary.orderCount.toString()],
                ["Cash", `$${cashDrawerSummary.cashSales.toFixed(2)}`],
                ["Card", `$${cashDrawerSummary.cardSales.toFixed(2)}`],
                ["Unpaid", `$${cashDrawerSummary.unpaid.toFixed(2)}`],
                ["Other", `$${cashDrawerSummary.otherSales.toFixed(2)}`],
                ["Avg", `$${cashDrawerSummary.averageOrder.toFixed(2)}`],
              ].map(([label, value]) => (
                <View
                  key={label}
                  className="min-w-[45%] flex-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <Text className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === tabs[2] && (
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              {t("revenue.salesAnalysis")}
            </Text>
            {itemSales.length === 0 ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {t("revenue.salesAnalysisPlaceholder")}
              </Text>
            ) : (
              <View>
                <View className="mb-2 flex-row border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="flex-1 text-xs font-bold uppercase text-slate-500">Item</Text>
                  <Text className="w-16 text-right text-xs font-bold uppercase text-slate-500">Qty</Text>
                  <Text className="w-24 text-right text-xs font-bold uppercase text-slate-500">Revenue</Text>
                </View>
                {itemSales.map((item) => (
                  <View
                    key={item.name}
                    className="flex-row border-b border-slate-100 py-2 dark:border-slate-800"
                  >
                    <Text
                      numberOfLines={1}
                      className="flex-1 font-medium text-slate-900 dark:text-white"
                    >
                      {item.name}
                    </Text>
                    <Text className="w-16 text-right text-slate-600 dark:text-slate-300">
                      {item.quantity}
                    </Text>
                    <Text className="w-24 text-right font-semibold text-slate-900 dark:text-white">
                      ${item.revenue.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <OrderDetailModal
        visible={orderModalVisible}
        order={selectedOrder}
        colors={colors}
        onClose={() => setOrderModalVisible(false)}
      />
    </View>
  );
}
