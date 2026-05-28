import { StatCard } from "@/components/analytics/StatCard";
import { OrderDetailModal } from "@/components/revenue/OrderDetailModal";
import { OrdersList } from "@/components/revenue/OrdersList";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStore } from "@/hooks/firestore/useStore";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { db } from "@/lib/firebase";
import {
  deriveStoreTimeZone,
  formatBusinessDayLabel,
  getBusinessDayWindow,
  type RevenueBusinessDayWindow,
} from "@/lib/pos/revenueBusinessDay";
import {
  parseReceiptItems,
  type RevenueDashboardSummary,
  type RevenueOrderSummary,
  summarizeRevenueDashboard,
  summarizeRevenueStats,
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
  StyleSheet,
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

const INITIAL_ORDERS: Order[] = [];
const REVENUE_PAGE_SIZE = 100;
const REVENUE_SUMMARY_PAGE_SIZE = 500;

type RevenueTab = "orders" | "cash" | "sales";

const REVENUE_TABS: Array<{ key: RevenueTab; labelKey: string }> = [
  { key: "orders", labelKey: "revenue.tab.allOrders" },
  { key: "cash", labelKey: "revenue.tab.cashDrawer" },
  { key: "sales", labelKey: "revenue.tab.salesAnalysis" },
];

const EMPTY_DASHBOARD_SUMMARY: RevenueDashboardSummary = {
  stats: summarizeRevenueStats([]),
  cashDrawer: {
    orderCount: 0,
    cashSales: 0,
    cardSales: 0,
    unpaid: 0,
    otherSales: 0,
    total: 0,
    averageOrder: 0,
  },
  itemSales: [],
};

const styles = StyleSheet.create({
  segmentedTabsScroll: {
    flexGrow: 0,
    height: 48,
  },
  segmentedTabsContent: {
    alignItems: "center",
    borderRadius: 10,
    minHeight: 48,
    padding: 4,
  },
  segmentedTab: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    minWidth: 128,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  segmentedTabActive: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentedTabText: {
    fontWeight: "600",
    textAlign: "center",
  },
});

export default function RevenueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const isPhone = !responsive.isTablet;
  const tabFontSize = responsive.isTablet ? 13 : 12;
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();
  const storeTimeZone = useMemo(
    () => deriveStoreTimeZone(store?.address.zip, store?.address.state),
    [store?.address.state, store?.address.zip]
  );

  const [businessDayWindow, setBusinessDayWindow] = useState(() => getBusinessDayWindow(new Date(), storeTimeZone));
  const [activeTab, setActiveTab] = useState<RevenueTab>("orders");
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [dashboardSummary, setDashboardSummary] = useState<RevenueDashboardSummary>(EMPTY_DASHBOARD_SUMMARY);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [lastOrderDoc, setLastOrderDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const fetchRevenuePage = React.useCallback(async ({
    append = false,
    afterDoc = null,
    windowOverride,
  }: {
    append?: boolean;
    afterDoc?: QueryDocumentSnapshot<DocumentData> | null;
    windowOverride?: RevenueBusinessDayWindow;
  } = {}) => {
    if (!user || !currentStoreId) return;

    const window = windowOverride ?? businessDayWindow;

    if (!append) setLoadingOrders(true);
    else setLoadingMoreOrders(true);

    try {
      const colRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment");
      const constraints: QueryConstraint[] = [
        where("dateTime", ">=", window.start),
        where("dateTime", "<=", window.end),
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
  }, [businessDayWindow, currentStoreId, t, user]);

  const fetchRevenueSummary = React.useCallback(async (
    windowOverride?: RevenueBusinessDayWindow
  ) => {
    if (!user || !currentStoreId) return;

    const window = windowOverride ?? businessDayWindow;
    setLoadingSummary(true);

    try {
      const colRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment");
      const allOrders: RevenueOrderSummary[] = [];
      let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

      while (true) {
        const constraints: QueryConstraint[] = [
          where("dateTime", ">=", window.start),
          where("dateTime", "<=", window.end),
          orderBy("dateTime", "desc"),
          limit(REVENUE_SUMMARY_PAGE_SIZE),
        ];

        if (cursor) constraints.push(startAfter(cursor));

        const snapshot = await getDocs(query(colRef, ...constraints));
        allOrders.push(
          ...snapshot.docs.map((docSnap) =>
            transformSuccessPaymentSummary(docSnap.id, docSnap.data())
          )
        );

        if (snapshot.docs.length < REVENUE_SUMMARY_PAGE_SIZE) break;
        cursor = snapshot.docs[snapshot.docs.length - 1];
      }

      setDashboardSummary(summarizeRevenueDashboard(allOrders));
    } catch (err) {
      console.error("Error loading success_payment summary:", err);
      setDashboardSummary(EMPTY_DASHBOARD_SUMMARY);
      Alert.alert(t("common.error"), "Failed to load revenue summary");
    } finally {
      setLoadingSummary(false);
    }
  }, [businessDayWindow, currentStoreId, t, user]);

  // Load from Firestore success_payment
  useEffect(() => {
    setOrders([]);
    setDashboardSummary(EMPTY_DASHBOARD_SUMMARY);
    setLastOrderDoc(null);
    setHasMoreOrders(false);
    void fetchRevenuePage();
    void fetchRevenueSummary();
  }, [fetchRevenuePage, fetchRevenueSummary]);

  const stats = dashboardSummary.stats;
  const total = stats.totalRevenue;
  const cashDrawerSummary = dashboardSummary.cashDrawer;
  const itemSales = dashboardSummary.itemSales;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const nextBusinessDayWindow = getBusinessDayWindow(new Date(), storeTimeZone);
      if (
        nextBusinessDayWindow.start !== businessDayWindow.start ||
        nextBusinessDayWindow.end !== businessDayWindow.end
      ) {
        setBusinessDayWindow(nextBusinessDayWindow);
      }
      await Promise.all([
        fetchRevenuePage({ windowOverride: nextBusinessDayWindow }),
        fetchRevenueSummary(nextBusinessDayWindow),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const businessDayLabel = useMemo(
    () => formatBusinessDayLabel(businessDayWindow, storeTimeZone),
    [businessDayWindow, storeTimeZone]
  );

  useEffect(() => {
    setBusinessDayWindow(getBusinessDayWindow(new Date(), storeTimeZone));
  }, [storeTimeZone]);

  const handleLoadMoreOrders = () => {
    if (!lastOrderDoc || !hasMoreOrders || loadingOrders || loadingMoreOrders) return;
    void fetchRevenuePage({ append: true, afterDoc: lastOrderDoc });
  };

  const handleRevenueScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeTab !== "orders") return;
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
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {t("revenue.businessDay")}
          </Text>
          <Text className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            {businessDayLabel}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loadingSummary ? t("common.loading") : t("revenue.businessDayHint")}
          </Text>
        </View>

        {isPhone ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ gap: responsive.baseSpacing }}
          >
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.totalRevenue")} value={loadingSummary ? "..." : `$${stats.totalRevenue}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.netSales")} value={loadingSummary ? "..." : `$${stats.netSales}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.tax")} value={loadingSummary ? "..." : `$${stats.tax}`} />
            </View>
            <View style={{ width: 152 }}>
              <StatCard title={t("revenue.totalTips")} value={loadingSummary ? "..." : `$${stats.tips}`} />
            </View>
          </ScrollView>
        ) : (
          <View className="flex-row gap-4">
            <View className="flex-1">
              <StatCard title={t("revenue.totalRevenue")} value={loadingSummary ? "..." : `$${stats.totalRevenue}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.netSales")} value={loadingSummary ? "..." : `$${stats.netSales}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.tax")} value={loadingSummary ? "..." : `$${stats.tax}`} />
            </View>
            <View className="flex-1">
              <StatCard title={t("revenue.totalTips")} value={loadingSummary ? "..." : `$${stats.tips}`} />
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          style={styles.segmentedTabsScroll}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.segmentedTabsContent,
            {
              gap: responsive.smallSpacing,
              backgroundColor: colorScheme === "dark" ? "#0f172a" : "#f1f5f9",
            },
          ]}
        >
          {REVENUE_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.segmentedTab,
                  {
                    backgroundColor: isActive
                      ? colorScheme === "dark" ? "#1e293b" : "#ffffff"
                      : "transparent",
                  },
                  isActive && styles.segmentedTabActive,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedTabText,
                    {
                      fontSize: tabFontSize,
                      color: isActive ? "#ea580c" : "#64748b",
                    },
                  ]}
                >
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === "orders" && (
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

        {activeTab === "cash" && (
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

        {activeTab === "sales" && (
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
