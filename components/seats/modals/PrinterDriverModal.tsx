import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, limit, query } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PrinterDriverModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  storeId: string | undefined;
}

type PrintJob = {
  type: "order" | "receipt";
  date: string;
  table: string;
};

function formatPrintDate(webDate: string): string {
  const parts = webDate.split("-");
  if (parts.length >= 6) {
    return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
  }
  return webDate;
}

function pickLatestJob(
  docs: { data: () => Record<string, unknown> }[],
  type: "order" | "receipt"
): PrintJob | undefined {
  let latest: PrintJob | undefined;

  for (const docSnap of docs) {
    const data = docSnap.data();
    const date = String(data.date ?? "");
    if (!date) continue;
    if (!latest || date > latest.date) {
      latest = {
        type,
        date,
        table: String(data.selectedTable ?? "-"),
      };
    }
  }

  return latest;
}

export function PrinterDriverModal({
  visible,
  onClose,
  userId,
  storeId,
}: PrinterDriverModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [loading, setLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState<PrintJob | undefined>();
  const [lastReceipt, setLastReceipt] = useState<PrintJob | undefined>();

  const loadRecentJobs = useCallback(async () => {
    if (!userId || !storeId) return;

    setLoading(true);
    try {
      const basePath = collection(
        db,
        "stripe_customers",
        userId,
        "TitleLogoNameContent",
        storeId
      );
      const [orderSnap, receiptSnap] = await Promise.all([
        getDocs(query(collection(basePath, "listOrder"), limit(10))),
        getDocs(query(collection(basePath, "MerchantReceipt"), limit(10))),
      ]);

      setLastOrder(pickLatestJob(orderSnap.docs, "order"));
      setLastReceipt(pickLatestJob(receiptSnap.docs, "receipt"));
    } catch (error) {
      console.error("Failed to load recent print jobs:", error);
      setLastOrder(undefined);
      setLastReceipt(undefined);
    } finally {
      setLoading(false);
    }
  }, [storeId, userId]);

  useEffect(() => {
    if (!visible) return;
    void loadRecentJobs();
  }, [loadRecentJobs, visible]);

  const renderJobRow = (job: PrintJob | undefined, labelKey: string) => (
    <View className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t(labelKey)}
      </Text>
      {job ? (
        <>
          <Text className="text-sm font-medium text-slate-900 dark:text-white">
            {formatPrintDate(job.date)}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("seats.printerDriver.tableLabel", { table: job.table })}
          </Text>
        </>
      ) : (
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {t("seats.printerDriver.none")}
        </Text>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="max-h-[85%] w-full max-w-md rounded-2xl bg-white p-4 dark:bg-slate-900">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="print-outline" size={22} color={colors.text} />
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {t("seats.printerDriver.title")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons name="information-circle-outline" size={18} color="#d97706" />
                <Text className="flex-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {t("seats.printerDriver.statusTitle")}
                </Text>
              </View>
              <Text className="text-sm leading-5 text-amber-900/90 dark:text-amber-100/90">
                {t("seats.printerDriver.description")}
              </Text>
              <Text className="mt-2 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">
                {t("seats.printerDriver.statusNote")}
              </Text>
            </View>

            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("seats.printerDriver.recentJobs")}
            </Text>

            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : (
              <View className="gap-2">
                {renderJobRow(lastOrder, "seats.printerDriver.lastOrderPrint")}
                {renderJobRow(lastReceipt, "seats.printerDriver.lastReceiptPrint")}
              </View>
            )}
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <TouchableOpacity
              onPress={() => void loadRecentJobs()}
              disabled={loading}
              className="flex-1 items-center rounded-xl border border-slate-200 py-3 dark:border-slate-700"
            >
              <Text className="font-semibold text-slate-700 dark:text-slate-200">
                {t("common.refresh")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center rounded-xl bg-orange-500 py-3"
            >
              <Text className="font-semibold text-white">{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
