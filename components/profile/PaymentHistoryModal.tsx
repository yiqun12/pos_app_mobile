import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import type { StoreSummary } from "@/lib/firestore/types";
import { subscribeUserPayments } from "@/lib/firestore/repositories/userPayments";
import type { UserPaymentRecord } from "@/lib/firestore/types";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentHistoryModalProps = {
  visible: boolean;
  storeList: StoreSummary[];
  onClose: () => void;
};

type ColorMode = (typeof Colors)["light"];

function resolveStoreName(
  storeId: string,
  storeList: StoreSummary[],
  language: string
): string {
  const store = storeList.find((item) => item.id === storeId);
  if (!store) return storeId;
  if (language === "zh" && store.nameCN) return store.nameCN;
  return store.name;
}

function PaymentRow({
  payment,
  storeName,
  colors,
  expanded,
  onToggle,
}: {
  payment: UserPaymentRecord;
  storeName: string;
  colors: ColorMode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        className="flex-row items-center p-4"
      >
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Ionicons name="receipt-outline" size={22} color="#f97316" />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-semibold text-slate-900 dark:text-white"
          >
            {storeName}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {payment.displayDate}
          </Text>
          <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {payment.isDineIn && payment.tableNum
              ? t("profile.purchaseHistoryTable", { table: payment.tableNum })
              : t("profile.purchaseHistoryTakeout")}
            {" · "}
            {payment.channel}
          </Text>
        </View>
        <View className="items-end pl-2">
          <Text className="text-base font-bold text-orange-600 dark:text-orange-400">
            ${payment.amount.toFixed(2)}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.tabIconDefault}
            style={{ marginTop: 6 }}
          />
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t("profile.purchaseHistoryOrderId")}
            </Text>
            <Text className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {payment.id.slice(0, 8)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t("profile.purchaseHistoryItems")}
            </Text>
            <Text className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {payment.itemCount}
            </Text>
          </View>
          {payment.total > 0 ? (
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {t("profile.purchaseHistorySubtotal")}
              </Text>
              <Text className="text-sm font-medium text-slate-800 dark:text-slate-200">
                ${payment.total.toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function PaymentHistoryModal({
  visible,
  storeList,
  onClose,
}: PaymentHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !user?.uid) {
      setPayments([]);
      setLoading(false);
      setError(null);
      setExpandedId(null);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserPayments(
      user.uid,
      (rows) => {
        setPayments(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading payment history:", err);
        setPayments([]);
        setLoading(false);
        setError(err);
      }
    );

    return unsubscribe;
  }, [user?.uid, visible]);

  const totalSpent = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <View
          className="rounded-t-3xl bg-white dark:bg-slate-950"
          style={{
            maxHeight: "88%",
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <View className="flex-row items-start justify-between">
              <View className="min-w-0 flex-1 pr-3">
                <Text
                  style={{ fontSize: responsive.subheadingFontSize + 2 }}
                  className="font-bold text-slate-900 dark:text-white"
                >
                  {t("profile.purchaseHistoryTitle")}
                </Text>
                <Text
                  style={{ fontSize: responsive.captionFontSize + 1, marginTop: 6 }}
                  className="text-slate-500 dark:text-slate-400"
                >
                  {t("profile.purchaseHistorySubtitle", { count: payments.length })}
                </Text>
                {!loading && payments.length > 0 ? (
                  <Text
                    style={{ fontSize: responsive.captionFontSize + 1, marginTop: 4 }}
                    className="font-semibold text-orange-600 dark:text-orange-400"
                  >
                    {t("profile.purchaseHistoryTotal", { amount: totalSpent.toFixed(2) })}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="items-center py-16">
                <ActivityIndicator size="large" color={colors.tint} />
                <Text className="mt-4 text-slate-500">{t("common.loading")}</Text>
              </View>
            ) : error ? (
              <View className="items-center py-16">
                <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
                <Text className="mt-4 text-center text-slate-600 dark:text-slate-300">
                  {t("profile.purchaseHistoryError")}
                </Text>
              </View>
            ) : payments.length === 0 ? (
              <View className="items-center py-16">
                <Ionicons name="receipt-outline" size={40} color={colors.tabIconDefault} />
                <Text className="mt-4 text-center text-base font-semibold text-slate-900 dark:text-white">
                  {t("profile.purchaseHistoryEmptyTitle")}
                </Text>
                <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t("profile.purchaseHistoryEmptySubtitle")}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12, paddingBottom: 8 }}>
                {payments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    storeName={resolveStoreName(payment.storeId, storeList, language)}
                    colors={colors}
                    expanded={expandedId === payment.id}
                    onToggle={() =>
                      setExpandedId((current) =>
                        current === payment.id ? null : payment.id
                      )
                    }
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
