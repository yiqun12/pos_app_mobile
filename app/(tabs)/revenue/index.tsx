import { DateRangeSelector } from "@/components/revenue/DateRangeSelector";
import { OrderDetailModal } from "@/components/revenue/OrderDetailModal";
import { OrdersList } from "@/components/revenue/OrdersList";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useModalAction } from "@/hooks/useModalAction";
import { useLocalSearchParams } from "expo-router"; // 用来获取 URL 里的 orderId
import React, { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";

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

const DEFAULT_RANGE = {
  startDate: "01/01/2026",
  endDate: "01/11/2026",
};

const PRESETS = [
  { label: "Today", startDate: "01/11/2026", endDate: "01/11/2026" },
  { label: "Yesterday", startDate: "01/10/2026", endDate: "01/10/2026" },
  { label: "January", startDate: "01/01/2026", endDate: "01/31/2026" },
  { label: "December", startDate: "12/01/2025", endDate: "12/31/2025" },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "A1001",
    guest: "Table 12",
    time: "10:12 AM",
    amount: 42.5,
    channel: "Dine-In",
    items: [
      {
        name: "Hot And Spicy Sichuan Style Chicken",
        quantity: 1,
        price: 16.95,
        total: 16.95,
      },
      { name: "Beef Rice Noodle Rolls", quantity: 1, price: 6.8, total: 6.8 },
      {
        name: "3pc Leek and Pork Dumplings",
        quantity: 1,
        price: 7.2,
        total: 7.2,
      },
      {
        name: "Garlic Romaine Lettuce (A choy)",
        quantity: 1,
        price: 15.0,
        total: 15.0,
      },
      {
        name: "Ginkgo and Scallop Congee (Porridge)",
        quantity: 1,
        price: 8.5,
        total: 8.5,
      },
      {
        name: "Eel Claypot Crispy Rice",
        quantity: 1,
        price: 15.8,
        total: 15.8,
      },
    ],
    subtotal: 70.25,
    serviceFee: 10.54,
    tax: 6.06,
    gratuity: 0.0,
    total: 86.85,
  },
  {
    id: "A1002",
    guest: "DoorDash",
    time: "10:30 AM",
    amount: 28.0,
    channel: "Pickup",
    items: [
      { name: "Beef Rice Noodle Rolls", quantity: 2, price: 6.8, total: 13.6 },
      { name: "Spring Rolls", quantity: 1, price: 5.0, total: 5.0 },
    ],
    subtotal: 18.6,
    serviceFee: 2.79,
    tax: 1.61,
    gratuity: 5.0,
    total: 28.0,
  },
  {
    id: "A1003",
    guest: "Table 4",
    time: "11:05 AM",
    amount: 65.75,
    channel: "Dine-In",
  },
  {
    id: "A1004",
    guest: "Uber Eats",
    time: "11:25 AM",
    amount: 33.25,
    channel: "Delivery",
  },
  {
    id: "A1005",
    guest: "Table 2",
    time: "12:10 PM",
    amount: 85.0,
    channel: "Dine-In",
  },
];

export default function RevenueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Today");
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const total = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2),
    [orders]
  );

  const handlePreset = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setSelectedPreset(label);
    setDateRange({ startDate: preset.startDate, endDate: preset.endDate });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setOrders((prev) => {
        const rotated = [...prev.slice(1), prev[0]];
        return rotated;
      });
      setRefreshing(false);
    }, 600);
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };
  // 1. 获取 AI 可能传过来的 orderId
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  // 2. 监听弹窗指令
  useModalAction((modalName) => {
    if (modalName === "orderDetail") {
      // 如果 AI 传了特定订单号，就去找这个订单
      if (orderId) {
        const targetOrder = orders.find((o) => o.id === orderId);
        if (targetOrder) {
          setSelectedOrder(targetOrder);
          setOrderModalVisible(true);
        } else {
          Alert.alert("Error", `Order ${orderId} not found.`);
        }
      } 
      // 如果没有传订单号，默认打开列表里的第一个订单（防止弹窗空白）
      else if (orders.length > 0) {
        setSelectedOrder(orders[0]);
        setOrderModalVisible(true);
      }
    }
  });

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title="Revenue" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4"
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

        <OrdersList
          orders={orders}
          total={total}
          colors={colors}
          onOrderPress={handleOrderPress}
        />
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
