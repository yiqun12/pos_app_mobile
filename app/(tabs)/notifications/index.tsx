import {
  Notification,
  NotificationCard,
  NotificationType,
} from "@/components/notifications";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "New Order Received",
    message: "Table 5 placed a new order with 4 items. Total: $48.50",
    timestamp: "2 min ago",
    isRead: false,
    orderId: "A1023",
    amount: 48.5,
  },
  {
    id: "2",
    type: "order",
    title: "New DoorDash Order",
    message: "DoorDash pickup order received. Ready in 15 minutes.",
    timestamp: "15 min ago",
    isRead: false,
    orderId: "D4521",
    amount: 32.0,
  },
  {
    id: "3",
    type: "payment",
    title: "Payment Received",
    message: "Table 12 payment completed via credit card.",
    timestamp: "1 hour ago",
    isRead: true,
    orderId: "A1019",
    amount: 86.75,
  },
  {
    id: "4",
    type: "alert",
    title: "Low Inventory Alert",
    message: "Chicken Rice is running low. Only 5 portions remaining.",
    timestamp: "2 hours ago",
    isRead: true,
  },
  {
    id: "5",
    type: "system",
    title: "System Update",
    message:
      "New features are available. Update your app to access the latest improvements.",
    timestamp: "Yesterday",
    isRead: true,
  },
  {
    id: "6",
    type: "order",
    title: "Order Completed",
    message: "Order #A1015 has been marked as completed.",
    timestamp: "Yesterday",
    isRead: true,
    orderId: "A1015",
  },
];

type FilterType = "all" | NotificationType;

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "order", label: "Orders" },
  { key: "payment", label: "Payments" },
  { key: "alert", label: "Alerts" },
  { key: "system", label: "System" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const handleRefresh = () => {
    setRefreshing(true);
    // TODO: 实际刷新逻辑
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    // Navigate to order details if it's an order notification
    if (notification.type === "order" && notification.orderId) {
      router.push(`/orders/${notification.orderId}`);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title="Notifications"
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              className="rounded-full bg-blue-100 px-3 py-1.5 dark:bg-blue-900/30"
            >
              <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View className="border-b border-slate-200 dark:border-slate-800">
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.key;
            const count =
              item.key === "all"
                ? notifications.length
                : notifications.filter((n) => n.type === item.key).length;

            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.key)}
                className={`mr-2 flex-row items-center rounded-full px-4 py-2 ${
                  isActive ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
                      isActive
                        ? "bg-white/20"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={handleNotificationPress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color={colors.tabIconDefault}
              />
            </View>
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              No Notifications
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Youre all caught up! New notifications will appear here.
            </Text>
          </View>
        }
        ListHeaderComponent={
          unreadCount > 0 ? (
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-blue-600" />
                <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Clear All Button (when there are notifications) */}
      {notifications.length > 0 && (
        <View className="absolute bottom-8 left-4 right-4">
          <TouchableOpacity
            onPress={handleClearAll}
            activeOpacity={0.7}
            className="flex-row items-center justify-center rounded-xl bg-slate-100 py-3 dark:bg-slate-800"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.tabIconDefault}
            />
            <Text className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              Clear All Notifications
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
