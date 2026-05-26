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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Alert,
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

function parseTimeToDisplay(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  const parts = dateTimeStr.split("-");
  if (parts.length < 6) return dateTimeStr;
  try {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10);
    const min = parseInt(parts[4], 10);
    const sec = parseInt(parts[5], 10);
    
    const date = new Date(Date.UTC(year, month, day, hour, min, sec));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateTimeStr;
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  // Load from Firestore success_payment
  useEffect(() => {
    if (!user || !currentStoreId) return;

    const startStr = parseDateToFirestoreString(dateRange.startDate, false);
    const endStr = parseDateToFirestoreString(dateRange.endDate, true);

    const colRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment");
    const q = query(
      colRef,
      where("dateTime", ">=", startStr),
      where("dateTime", "<=", endStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const meta = data.metadata || {};
        
        const subtotal = typeof meta.subtotal === "number" ? meta.subtotal : parseFloat(meta.subtotal || "0");
        const tax = typeof meta.tax === "number" ? meta.tax : parseFloat(meta.tax || "0");
        const gratuity = typeof meta.tips === "number" ? meta.tips : parseFloat(meta.tips || "0");
        const serviceFee = typeof meta.service_fee === "number" ? meta.service_fee : parseFloat(meta.service_fee || "0");
        const totalVal = typeof meta.total === "number" ? meta.total : parseFloat(meta.total || "0");
        const amount = typeof data.amount === "number" ? data.amount / 100 : totalVal;

        let parsedItems: OrderItem[] = [];
        if (data.receiptData) {
          try {
            const rawItems = JSON.parse(data.receiptData);
            if (Array.isArray(rawItems)) {
              parsedItems = rawItems.map((ri: any) => {
                const riSubtotal = ri.subtotal ?? ri.price;
                const riPrice = typeof riSubtotal === "number" ? riSubtotal : parseFloat(riSubtotal || "0");
                return {
                  name: ri.name || "Untitled",
                  quantity: typeof ri.quantity === "number" ? ri.quantity : 1,
                  price: riPrice,
                  total: ri.itemTotalPrice ? parseFloat(ri.itemTotalPrice) : (riPrice * (ri.quantity || 1)),
                };
              });
            }
          } catch (e) {
            console.error("Error parsing receiptData:", e);
          }
        }

        const channel = data.powerBy || (meta.isDine ? "Dine-In" : "TakeOut");
        const guest = meta.isDine && data.tableNum ? `Table ${data.tableNum}` : "TakeOut";

        return {
          id: docSnap.id,
          guest,
          time: parseTimeToDisplay(data.dateTime || ""),
          amount,
          channel,
          items: parsedItems,
          subtotal,
          serviceFee,
          tax,
          gratuity,
          total: totalVal,
        };
      });

      // Sort by doc id / dateTime descending
      fetched.sort((a, b) => b.id.localeCompare(a.id));

      setOrders(fetched);
    }, (err) => {
      console.error("Error loading success_payment:", err);
    });

    return () => unsubscribe();
  }, [user, currentStoreId, dateRange]);

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

  const handlePreset = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setSelectedPreset(label);
    setDateRange({ startDate: preset.startDate, endDate: preset.endDate });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  useModalAction((modalName) => {
    if (modalName === "orderDetail") {
      if (orderId) {
        const targetOrder = orders.find((o) => o.id === orderId);
        if (targetOrder) {
          setSelectedOrder(targetOrder);
          setOrderModalVisible(true);
        } else {
          Alert.alert(t("common.error"), t("revenue.orderNotFound", { orderId }));
        }
      } else if (orders.length > 0) {
        setSelectedOrder(orders[0]);
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
            onOrderPress={handleOrderPress}
          />
        )}

        {activeTab === tabs[1] && (
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              {t("revenue.cashDrawer")}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t("revenue.cashDrawerPlaceholder")}
            </Text>
          </View>
        )}

        {activeTab === tabs[2] && (
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              {t("revenue.salesAnalysis")}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t("revenue.salesAnalysisPlaceholder")}
            </Text>
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
