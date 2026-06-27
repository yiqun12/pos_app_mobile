import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ItemSalesTotals } from "@/lib/pos/revenueTransforms";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface ItemSalesSummaryCardProps {
  totals: ItemSalesTotals;
  loading?: boolean;
}

type StatItem = {
  key: keyof ItemSalesTotals;
  labelKey: string;
  format: "count" | "money";
};

const STAT_ITEMS: StatItem[] = [
  { key: "totalItems", labelKey: "revenue.sales.totalItems", format: "count" },
  { key: "totalQuantity", labelKey: "revenue.sales.totalQuantity", format: "count" },
  { key: "totalRevenue", labelKey: "revenue.sales.totalRevenue", format: "money" },
];

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatValue(value: number, format: "count" | "money"): string {
  if (format === "money") return `$${value.toFixed(2)}`;
  return formatQuantity(value);
}

function StatCell({
  label,
  value,
  loading,
  showRightBorder,
}: {
  label: string;
  value: string;
  loading?: boolean;
  showRightBorder?: boolean;
}) {
  const responsive = useResponsiveLayout();
  const valueFontSize = responsive.isTablet
    ? responsive.headingFontSize + 2
    : 20;

  return (
    <View
      className={`flex-1 px-2 py-3 ${
        showRightBorder ? "border-r border-slate-100 dark:border-slate-800" : ""
      }`}
    >
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={{ fontSize: responsive.captionFontSize }}
        className="text-center font-medium text-slate-500 dark:text-slate-400"
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{
          fontSize: valueFontSize,
          lineHeight: valueFontSize + 6,
          marginTop: 6,
        }}
        className="text-center font-bold text-slate-900 dark:text-white"
      >
        {loading ? "..." : value}
      </Text>
    </View>
  );
}

export function ItemSalesSummaryCard({ totals, loading = false }: ItemSalesSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <View className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row">
        {STAT_ITEMS.map((item, index) => (
          <StatCell
            key={item.key}
            label={t(item.labelKey)}
            value={formatValue(totals[item.key], item.format)}
            loading={loading}
            showRightBorder={index < STAT_ITEMS.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
