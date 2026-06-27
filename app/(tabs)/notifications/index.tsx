import {
  Notification,
  NotificationCard,
  NotificationType,
} from "@/components/notifications";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useNotifications } from "@/context/notifications";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSeats } from "@/hooks/firestore/useSeats";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
  } = useNotifications();
  const { data: seatLayout } = useSeats();
  const isTablet = responsive.isTablet;
  const filterLabelSize = isTablet ? 17 : 14;
  const filterCountSize = isTablet ? 15 : 12;
  const markAllFontSize = isTablet ? 16 : 12;

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

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
    } catch {
      Alert.alert(t("common.error"), t("notifications.confirmFailed"));
      return;
    }

    if (notification.tableName && seatLayout?.tables?.length) {
      const seat = seatLayout.tables.find((table) => table.name === notification.tableName);
      if (seat) {
        router.push(`/(tabs)/seats/${seat.id}`);
        return;
      }
    }

    if (notification.type === "order" && notification.orderId) {
      router.push(`/orders/${notification.orderId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      Alert.alert(t("common.error"), t("notifications.confirmFailed"));
    }
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
          onPress: async () => {
            try {
              await clearAll();
            } catch {
              Alert.alert(t("common.error"), t("notifications.confirmFailed"));
            }
          },
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
          loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color={colors.tint} />
              <Text className="mt-4 text-slate-500 dark:text-slate-400">{t("common.loading")}</Text>
            </View>
          ) : (
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
          )
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
