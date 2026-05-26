import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export interface ItemAnalytic {
  name: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  trend: "up" | "down" | "stable";
}

interface AnalyticsTableProps {
  data: ItemAnalytic[];
}

export function AnalyticsTable({ data }: AnalyticsTableProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="mb-3 flex-row items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
        <Text className="w-2/5 text-xs font-bold text-slate-900 dark:text-white">
          {t("analytics.table.item")}
        </Text>
        <Text className="w-1/6 text-right text-xs font-bold text-slate-900 dark:text-white">
          {t("analytics.table.qty")}
        </Text>
        <Text className="w-1/4 text-right text-xs font-bold text-slate-900 dark:text-white">
          {t("analytics.table.revenue")}
        </Text>
        <Text className="w-1/5 text-right text-xs font-bold text-slate-900 dark:text-white">
          {t("analytics.table.price")}
        </Text>
      </View>

      {data.map((item, idx) => (
        <View
          key={idx}
          className="flex-row items-center justify-between border-b border-slate-200 py-3 dark:border-slate-700"
        >
          <View className="w-2/5">
            <Text className="text-xs font-semibold text-slate-900 dark:text-white">
              {item.name}
            </Text>
          </View>
          <Text className="w-1/6 text-right text-sm font-bold text-slate-900 dark:text-white">
            {item.quantitySold}
          </Text>
          <Text className="w-1/4 text-right text-sm font-bold text-green-600 dark:text-green-400">
            ${item.totalRevenue.toFixed(2)}
          </Text>
          <View className="w-1/5 flex-row items-center justify-end gap-1">
            <Text className="text-right text-xs font-semibold text-purple-600 dark:text-purple-400">
              ${item.averagePrice.toFixed(2)}
            </Text>
            <TrendIcon trend={item.trend} />
          </View>
        </View>
      ))}
    </View>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <Ionicons name="trending-up" size={14} color="#10b981" />;
  } else if (trend === "down") {
    return <Ionicons name="trending-down" size={14} color="#ef4444" />;
  }
  return <Ionicons name="remove" size={14} color="#6b7280" />;
}
