import { BankReceiptPreviewModal } from "@/components/revenue/BankReceiptPreviewModal";
import { ItemSalesSummaryCard } from "@/components/revenue/ItemSalesSummaryCard";
import { OrderDetailModal } from "@/components/revenue/OrderDetailModal";
import { OrdersList } from "@/components/revenue/OrdersList";
import { RevenueBreakdownPieChart } from "@/components/revenue/RevenueBreakdownPieChart";
import { RevenueDateRangeModal } from "@/components/revenue/RevenueDateRangeModal";
import { RevenueLineChartModal } from "@/components/revenue/RevenueLineChartModal";
import { RevenueMoreMenuModal } from "@/components/revenue/RevenueMoreMenuModal";
import { RevenueSummaryCard } from "@/components/revenue/RevenueSummaryCard";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStore } from "@/hooks/firestore/useStore";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { db } from "@/lib/firebase";
import {
  deriveStoreTimeZone,
  formatBusinessDayLabel,
  getRevenueWindowForPreset,
  type RevenueBusinessDayWindow,
  type RevenueDatePreset,
} from "@/lib/pos/revenueBusinessDay";
import {
  parseReceiptItems,
  type RevenueDashboardSummary,
  type RevenueOrderSummary,
  summarizeRevenueDashboard,
  summarizeRevenueStats,
  transformSuccessPaymentSummary,
} from "@/lib/pos/revenueTransforms";
import { getRevenueRangeLabel } from "@/lib/pos/revenueRangeLabel";
import { sliceRevenuePage } from "@/lib/pos/revenuePagination";
import {
  buildBankReceiptPreviewModel,
  canRequestBankReceipt,
  fetchBankReceiptViaCloudFunction,
  formatBankReceiptDisplayDate,
  type BankReceiptPreviewModel,
} from "@/lib/pos/bankReceipt";
import {
  buildReceiptPreviewModel,
  resolvePreviewStore,
  type ReceiptPreviewModel,
  type ReceiptReplayType,
} from "@/lib/pos/receiptPreviewCore";
import { buildCashTipsPatch } from "@/lib/pos/revenueActions";
import {
  collection,
  doc,
  type DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  startAfter,
  updateDoc,
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
  tableNum?: string;
  metadata?: Record<string, unknown>;
  latestCharge?: string;
  transactionJson?: Record<string, unknown>;
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
  itemSalesTotals: {
    totalItems: 0,
    totalQuantity: 0,
    totalRevenue: 0,
  },
  itemSales: [],
  dailyRevenue: [],
  revenueBreakdown: {
    totalRevenue: 0,
    totalParts: 0,
    items: [
      { key: "subtotal", label: "Subtotal", value: 0, percentage: 0, color: "#0088FE" },
      { key: "tax", label: "Tax", value: 0, percentage: 0, color: "#00C49F" },
      { key: "gratuity", label: "Cash Gratuity", value: 0, percentage: 0, color: "#FF8042" },
      { key: "serviceFee", label: "Service Fee", value: 0, percentage: 0, color: "#9e2820" },
      { key: "discount", label: "Discount", value: 0, percentage: 0, color: "#000000" },
    ],
  },
};

const styles = StyleSheet.create({
  segmentedTabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    minHeight: 48,
    padding: 4,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    minWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 8,
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
  const tabFontSize = responsive.isTablet ? 13 : 12;
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();
  const storeTimeZone = useMemo(
    () => deriveStoreTimeZone(store?.address.zip, store?.address.state),
    [store?.address.state, store?.address.zip]
  );

  const [businessDayWindow, setBusinessDayWindow] = useState<RevenueBusinessDayWindow>(() =>
    getRevenueWindowForPreset("today", "America/Los_Angeles")
  );
  const [selectedPreset, setSelectedPreset] = useState<RevenueDatePreset>("today");
  const [customStartDate, setCustomStartDate] = useState(() => new Date());
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [lineChartVisible, setLineChartVisible] = useState(false);
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
  const [addCashTipsVisible, setAddCashTipsVisible] = useState(false);
  const [bankReceiptPreviewVisible, setBankReceiptPreviewVisible] = useState(false);
  const [bankReceiptPreviewModel, setBankReceiptPreviewModel] =
    useState<BankReceiptPreviewModel | null>(null);
  const [bankReceiptPreviewLoading, setBankReceiptPreviewLoading] = useState(false);
  const [bankReceiptPreviewError, setBankReceiptPreviewError] = useState<string | null>(null);
  const [receiptPreviewVisible, setReceiptPreviewVisible] = useState(false);
  const [receiptPreviewModel, setReceiptPreviewModel] =
    useState<ReceiptPreviewModel | null>(null);
  const [revenueActionBusy, setRevenueActionBusy] = useState<string | null>(null);
  const [revenueActionStatus, setRevenueActionStatus] = useState<{
    tone: "info" | "success" | "error";
    message: string;
  } | null>(null);

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

      setDashboardSummary(summarizeRevenueDashboard(allOrders, window, storeTimeZone));
    } catch (err) {
      console.error("Error loading success_payment summary:", err);
      setDashboardSummary(EMPTY_DASHBOARD_SUMMARY);
      Alert.alert(t("common.error"), "Failed to load revenue summary");
    } finally {
      setLoadingSummary(false);
    }
  }, [businessDayWindow, currentStoreId, storeTimeZone, t, user]);

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
  const itemSalesTotals = dashboardSummary.itemSalesTotals;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const nextWindow = getRevenueWindowForPreset(selectedPreset, storeTimeZone, new Date(), {
        start: customStartDate,
        end: customEndDate,
      });
      setBusinessDayWindow(nextWindow);
      await Promise.all([
        fetchRevenuePage({ windowOverride: nextWindow }),
        fetchRevenueSummary(nextWindow),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const businessDayLabel = useMemo(
    () => formatBusinessDayLabel(businessDayWindow, storeTimeZone),
    [businessDayWindow, storeTimeZone]
  );

  const selectedRangeLabel = useMemo(
    () => getRevenueRangeLabel(selectedPreset, t),
    [selectedPreset, t]
  );

  const headerSubtitle = useMemo(
    () =>
      t("revenue.subtitleForRange", {
        range: selectedRangeLabel,
        dates: businessDayLabel,
      }),
    [businessDayLabel, selectedRangeLabel, t]
  );

  useEffect(() => {
    setBusinessDayWindow(
      getRevenueWindowForPreset(selectedPreset, storeTimeZone, new Date(), {
        start: customStartDate,
        end: customEndDate,
      })
    );
  }, [storeTimeZone]);

  const handleApplyDateRange = ({
    preset,
    startDate,
    endDate,
    window,
  }: {
    preset: RevenueDatePreset;
    startDate: Date;
    endDate: Date | null;
    window: RevenueBusinessDayWindow;
  }) => {
    setSelectedPreset(preset);
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setBusinessDayWindow(window);
    setDateModalVisible(false);
  };

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
    setRevenueActionStatus(null);
    setOrderModalVisible(true);
  };

  const handleAddCashTips = async (extraTip: number) => {
    if (!user || !currentStoreId || !selectedOrder) return;
    setRevenueActionBusy("tips");
    setRevenueActionStatus({ tone: "info", message: t("revenue.savingCashTips") });
    try {
      const patch = buildCashTipsPatch(selectedOrder, extraTip);
      await updateDoc(
        doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment", selectedOrder.id),
        patch
      );
      const nextTotal = patch["metadata.total"] as number;
      const nextTips = patch["metadata.tips"] as number;
      setSelectedOrder((prev) => prev ? {
        ...prev,
        amount: nextTotal,
        total: nextTotal,
        gratuity: nextTips,
        metadata: {
          ...(prev.metadata ?? {}),
          total: nextTotal,
          tips: nextTips,
        },
      } : prev);
      setOrders((prev) => prev.map((order) => order.id === selectedOrder.id ? {
        ...order,
        amount: nextTotal,
        total: nextTotal,
        gratuity: nextTips,
        metadata: {
          ...(order.metadata ?? {}),
          total: nextTotal,
          tips: nextTips,
        },
      } : order));
      setAddCashTipsVisible(false);
      await handleRefresh();
      setRevenueActionStatus({ tone: "success", message: t("revenue.cashTipsAdded") });
    } catch (err) {
      console.error("Failed to add cash tips:", err);
      setRevenueActionStatus({ tone: "error", message: t("revenue.actionFailed") });
    } finally {
      setRevenueActionBusy(null);
    }
  };

  const handleBankReceipt = async () => {
    if (!selectedOrder || !store) return;

    if (!canRequestBankReceipt(selectedOrder, store.stripeStoreAcct)) {
      Alert.alert(t("common.error"), t("revenue.bankReceiptUnavailable"));
      return;
    }

    setRevenueActionBusy("bank");
    setBankReceiptPreviewVisible(true);
    setBankReceiptPreviewLoading(true);
    setBankReceiptPreviewError(null);
    setBankReceiptPreviewModel(null);
    setRevenueActionStatus({
      tone: "info",
      message: t("revenue.bankReceiptLoading"),
    });

    try {
      const response = await fetchBankReceiptViaCloudFunction({
        chargeId: selectedOrder.latestCharge!,
        docId: selectedOrder.id,
        displayDate: formatBankReceiptDisplayDate(
          selectedOrder.dateTime,
          selectedOrder.time
        ),
        stripeStoreAcct: store.stripeStoreAcct!,
      });

      const model = buildBankReceiptPreviewModel({
        store,
        order: selectedOrder,
        response,
        t,
      });
      setBankReceiptPreviewModel(model);
      setRevenueActionStatus(null);
    } catch (err) {
      console.error("Failed to load bank receipt:", err);
      const message =
        err instanceof Error ? err.message : t("revenue.bankReceiptFailed");
      setBankReceiptPreviewError(message);
      setRevenueActionStatus({ tone: "error", message: t("revenue.bankReceiptFailed") });
    } finally {
      setBankReceiptPreviewLoading(false);
      setRevenueActionBusy(null);
    }
  };

  const handleReceiptPreview = (type: ReceiptReplayType) => {
    if (!selectedOrder) return;
    const previewStore = resolvePreviewStore(store, currentStoreId);
    const model = buildReceiptPreviewModel({
      store: previewStore,
      order: selectedOrder,
      type,
      t,
    });
    setReceiptPreviewModel(model);
    setReceiptPreviewVisible(true);
    setRevenueActionStatus(null);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("revenue.title")}
        subtitle={headerSubtitle}
        rightElement={
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={() => setDateModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel={t("revenue.selectDateRange")}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMoreMenuVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel={t("revenue.moreMenu")}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        }
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
            {t("revenue.dateRange")}
          </Text>
          <Text className="mt-1 text-base font-bold text-orange-600 dark:text-orange-400">
            {selectedRangeLabel}
          </Text>
          <Text className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            {businessDayLabel}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loadingSummary ? t("common.loading") : t("revenue.businessDayHint")}
          </Text>
        </View>

        <RevenueSummaryCard stats={stats} loading={loadingSummary} />

        <View
          style={[
            styles.segmentedTabsContainer,
            {
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
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
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
        </View>

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
            <ItemSalesSummaryCard totals={itemSalesTotals} loading={loadingSummary} />
            <RevenueBreakdownPieChart
              revenueBreakdown={dashboardSummary.revenueBreakdown}
              loading={loadingSummary}
            />
            {itemSales.length === 0 ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {t("revenue.salesAnalysisPlaceholder")}
              </Text>
            ) : (
              <View>
                <View className="mb-2 flex-row border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="flex-1 text-xs font-bold uppercase text-slate-500">
                    {t("analytics.table.item")}
                  </Text>
                  <Text className="w-16 text-right text-xs font-bold uppercase text-slate-500">
                    {t("analytics.table.qty")}
                  </Text>
                  <Text className="w-24 text-right text-xs font-bold uppercase text-slate-500">
                    {t("analytics.table.revenue")}
                  </Text>
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
        onClose={() => {
          setAddCashTipsVisible(false);
          setReceiptPreviewVisible(false);
          setReceiptPreviewModel(null);
          setOrderModalVisible(false);
        }}
        onAddCashTips={() => setAddCashTipsVisible(true)}
        cashTipsVisible={addCashTipsVisible}
        onCloseCashTips={() => setAddCashTipsVisible(false)}
        onSaveCashTips={handleAddCashTips}
        cashTipsSaving={revenueActionBusy === "tips"}
        onBankReceipt={
          canRequestBankReceipt(selectedOrder, store?.stripeStoreAcct)
            ? handleBankReceipt
            : undefined
        }
        onMerchantReceipt={() => handleReceiptPreview("MerchantReceipt")}
        onCustomerReceipt={() => handleReceiptPreview("CustomerReceipt")}
        receiptPreviewVisible={receiptPreviewVisible}
        receiptPreviewModel={receiptPreviewModel}
        onCloseReceiptPreview={() => {
          setReceiptPreviewVisible(false);
          setReceiptPreviewModel(null);
        }}
        busyAction={revenueActionBusy}
        actionStatus={revenueActionStatus}
      />

      <BankReceiptPreviewModal
        visible={bankReceiptPreviewVisible}
        colors={colors}
        loading={bankReceiptPreviewLoading}
        error={bankReceiptPreviewError}
        model={bankReceiptPreviewModel}
        onClose={() => {
          setBankReceiptPreviewVisible(false);
          setBankReceiptPreviewError(null);
          setBankReceiptPreviewModel(null);
        }}
      />

      <RevenueDateRangeModal
        visible={dateModalVisible}
        colors={colors}
        timeZone={storeTimeZone}
        selectedPreset={selectedPreset}
        startDate={customStartDate}
        endDate={customEndDate}
        onClose={() => setDateModalVisible(false)}
        onApply={handleApplyDateRange}
      />

      <RevenueMoreMenuModal
        visible={moreMenuVisible}
        colors={colors}
        onClose={() => setMoreMenuVisible(false)}
        onOpenLineChart={() => setLineChartVisible(true)}
      />

      <RevenueLineChartModal
        visible={lineChartVisible}
        colors={colors}
        data={dashboardSummary.dailyRevenue}
        rangeLabel={selectedRangeLabel}
        rangeDates={businessDayLabel}
        loading={loadingSummary}
        onClose={() => setLineChartVisible(false)}
      />
    </View>
  );
}
