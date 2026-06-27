import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export type NotificationType = "order" | "system" | "alert" | "payment";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
  tableName?: string;
  amount?: number;
}

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkRead?: (id: string) => void;
}

const typeConfig: Record<
  NotificationType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    bgColor: string;
    iconColor: string;
    label: string;
  }
> = {
  order: {
    icon: "receipt",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "#2563eb",
    label: "New Order",
  },
  system: {
    icon: "information-circle",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    iconColor: "#64748b",
    label: "System",
  },
  alert: {
    icon: "warning",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "#f59e0b",
    label: "Alert",
  },
  payment: {
    icon: "card",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "#16a34a",
    label: "Payment",
  },
};

export function NotificationCard({
  notification,
  onPress,
  onMarkRead,
}: NotificationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const config = typeConfig[notification.type];

  return (
    <TouchableOpacity
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
      className={`mb-3 rounded-xl border p-4 ${
        notification.isRead
          ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          : "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10"
      }`}
    >
      <View className="flex-row">
        {/* Icon */}
        <View
          className={`mr-3 h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}
        >
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {/* Type Label */}
              <View
                className={`mr-2 rounded-md px-2 py-0.5 ${
                  notification.type === "order"
                    ? "bg-blue-600"
                    : notification.type === "alert"
                      ? "bg-amber-500"
                      : notification.type === "payment"
                        ? "bg-green-600"
                        : "bg-slate-500"
                }`}
              >
                <Text style={{ fontSize: responsive.captionFontSize }} className="font-semibold text-white">
                  {notification.type === "order"
                    ? t("notifications.badgeOrder")
                    : notification.type === "alert"
                      ? t("notifications.badgeAlert")
                      : notification.type === "payment"
                        ? t("notifications.badgePayment")
                        : t("notifications.badgeSystem")}
                </Text>
              </View>
              {/* Unread Dot */}
              {!notification.isRead && (
                <View className="h-2 w-2 rounded-full bg-blue-600" />
              )}
            </View>
            {/* Timestamp */}
            <Text style={{ fontSize: responsive.captionFontSize }} className="text-slate-400 dark:text-slate-500">
              {notification.timestamp}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{ fontSize: responsive.baseFontSize }}
            className={`mt-2 font-semibold ${
              notification.isRead
                ? "text-slate-700 dark:text-slate-300"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {notification.title}
          </Text>

          {/* Message */}
          <Text
            style={{ fontSize: responsive.baseFontSize - 2 }}
            className="mt-1 text-slate-500 dark:text-slate-400"
            numberOfLines={2}
          >
            {notification.message}
          </Text>

          {/* Order/Amount Info */}
          {(notification.orderId || notification.amount) && (
            <View className="mt-2 flex-row items-center">
              {notification.orderId && (
                <View className="mr-3 flex-row items-center">
                  <Ionicons
                    name="document-text"
                    size={14}
                    color={colors.tabIconDefault}
                  />
                  <Text style={{ fontSize: responsive.captionFontSize }} className="ml-1 text-slate-500 dark:text-slate-400">
                    #{notification.orderId}
                  </Text>
                </View>
              )}
              {notification.amount && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="cash"
                    size={14}
                    color={colors.tabIconDefault}
                  />
                  <Text style={{ fontSize: responsive.captionFontSize }} className="ml-1 font-semibold text-green-600 dark:text-green-400">
                    ${notification.amount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

