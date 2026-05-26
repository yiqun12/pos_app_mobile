import {
  Notification,
  NotificationCard,
  NotificationType,
} from "@/components/notifications";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FilterType = "all" | NotificationType;

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const filterLabelSize = isTablet ? 17 : 14;
  const filterCountSize = isTablet ? 15 : 12;
  const markAllFontSize = isTablet ? 16 : 12;

  const initialNotifications = useMemo<Notification[]>(
    () => [
      {
        id: "1",
        type: "order",
        title: t("notifications.mock.newOrderReceived.title"),
        message: t("notifications.mock.newOrderReceived.message"),
        timestamp: t("notifications.mock.time.2MinAgo"),
        isRead: false,
        orderId: "A1023",
        amount: 48.5,
      },
      {
        id: "2",
        type: "order",
        title: t("notifications.mock.newDoorDashOrder.title"),
        message: t("notifications.mock.newDoorDashOrder.message"),
        timestamp: t("notifications.mock.time.15MinAgo"),
        isRead: false,
        orderId: "D4521",
        amount: 32.0,
      },
      {
        id: "3",
        type: "payment",
        title: t("notifications.mock.paymentReceived.title"),
        message: t("notifications.mock.paymentReceived.message"),
        timestamp: t("notifications.mock.time.1HourAgo"),
        isRead: true,
        orderId: "A1019",
        amount: 86.75,
      },
      {
        id: "4",
        type: "alert",
        title: t("notifications.mock.lowInventoryAlert.title"),
        message: t("notifications.mock.lowInventoryAlert.message"),
        timestamp: t("notifications.mock.time.2HoursAgo"),
        isRead: true,
      },
      {
        id: "5",
        type: "system",
        title: t("notifications.mock.systemUpdate.title"),
        message: t("notifications.mock.systemUpdate.message"),
        timestamp: t("notifications.mock.time.yesterday"),
        isRead: true,
      },
      {
        id: "6",
        type: "order",
        title: t("notifications.mock.orderCompleted.title"),
        message: t("notifications.mock.orderCompleted.message"),
        timestamp: t("notifications.mock.time.yesterday"),
        isRead: true,
        orderId: "A1015",
      },
    ],
    [t]
  );

  const filters: { key: FilterType; label: string }[] = useMemo(
    () => [
      { key: "all", label: t("notifications.filterAll") },
      { key: "order", label: t("notifications.filterOrders") },
      { key: "payment", label: t("notifications.filterPayments") },
      { key: "alert", label: t("notifications.filterAlerts") },
      { key: "system", label: t("notifications.filterSystem") },
    ],
    [t]
  );

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    if (notification.type === "order" && notification.orderId) {
      router.push(`/orders/${notification.orderId}`);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      t("notifications.clearAllTitle"),
      t("notifications.clearAllMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("notifications.clearAllButton"),
          style: "destructive",
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("notifications.title")}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              className="rounded-full bg-orange-100 px-3 py-1.5 dark:bg-orange-900/30"
            >
              <Text
                className="font-semibold text-orange-600 dark:text-orange-400"
                style={{ fontSize: markAllFontSize }}
              >
                {t("notifications.markAllRead")}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View className="border-b border-slate-200 dark:border-slate-800">
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: responsive.mediumSpacing,
            paddingVertical: 12,
          }}
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
                  isActive ? "bg-orange-500" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
                  }`}
                  style={{ fontSize: filterLabelSize }}
                >
                  {item.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
                      isActive ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
                      }`}
                      style={{ fontSize: filterCountSize }}
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

      <FlatList
        data={filteredNotifications}
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={handleNotificationPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: responsive.mediumSpacing,
          paddingBottom: 100,
        }}
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
              {t("notifications.emptyTitle")}
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("notifications.emptySubtitle")}
            </Text>
          </View>
        }
        ListHeaderComponent={
          unreadCount > 0 ? (
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-blue-600" />
                <Text
                  className="font-medium text-slate-600 dark:text-slate-400"
                  style={{ fontSize: isTablet ? 16 : 14 }}
                >
                  {t("notifications.unreadCount", { count: unreadCount })}
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {notifications.length > 0 && (
        <View
          className="absolute bottom-8"
          style={{
            left: responsive.mediumSpacing,
            right: responsive.mediumSpacing,
          }}
        >
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
            <Text
              className="ml-2 font-medium text-slate-600 dark:text-slate-400"
              style={{ fontSize: isTablet ? 16 : 14 }}
            >
              {t("notifications.clearAllCta")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
