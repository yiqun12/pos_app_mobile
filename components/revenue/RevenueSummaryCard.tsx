import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type RevenueSummaryStats = {
  totalRevenue: string;
  netSales: string;
  tax: string;
  tips: string;
};

interface RevenueSummaryCardProps {
  stats: RevenueSummaryStats;
  loading?: boolean;
}

type StatItem = {
  key: keyof RevenueSummaryStats;
  labelKey: string;
};

const STAT_ITEMS: StatItem[] = [
  { key: "totalRevenue", labelKey: "revenue.totalRevenue" },
  { key: "netSales", labelKey: "revenue.netSales" },
  { key: "tax", labelKey: "revenue.tax" },
  { key: "tips", labelKey: "revenue.totalTips" },
];

function StatCell({
  label,
  value,
  loading,
  showRightBorder,
  showBottomBorder,
  compact,
}: {
  label: string;
  value: string;
  loading?: boolean;
  showRightBorder?: boolean;
  showBottomBorder?: boolean;
  compact?: boolean;
}) {
  const responsive = useResponsiveLayout();
  const valueFontSize = compact
    ? responsive.isTablet
      ? responsive.headingFontSize
      : 20
    : responsive.isTablet
      ? responsive.headingFontSize + 2
      : 22;

  return (
    <View
      className={`flex-1 px-3 py-3 ${
        showRightBorder ? "border-r border-slate-100 dark:border-slate-800" : ""
      } ${showBottomBorder ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
    >
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={{ fontSize: responsive.captionFontSize }}
        className="font-medium text-slate-500 dark:text-slate-400"
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
          marginTop: compact ? 6 : 8,
        }}
        className="font-bold text-slate-900 dark:text-white"
      >
        {loading ? "..." : `$${value}`}
      </Text>
    </View>
  );
}

export function RevenueSummaryCard({ stats, loading = false }: RevenueSummaryCardProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;

  if (isTablet) {
    return (
      <View className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row">
          {STAT_ITEMS.map((item, index) => (
            <StatCell
              key={item.key}
              label={t(item.labelKey)}
              value={stats[item.key]}
              loading={loading}
              showRightBorder={index < STAT_ITEMS.length - 1}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row">
        <StatCell
          label={t(STAT_ITEMS[0].labelKey)}
          value={stats[STAT_ITEMS[0].key]}
          loading={loading}
          showRightBorder
          showBottomBorder
          compact
        />
        <StatCell
          label={t(STAT_ITEMS[1].labelKey)}
          value={stats[STAT_ITEMS[1].key]}
          loading={loading}
          showBottomBorder
          compact
        />
      </View>
      <View className="flex-row">
        <StatCell
          label={t(STAT_ITEMS[2].labelKey)}
          value={stats[STAT_ITEMS[2].key]}
          loading={loading}
          showRightBorder
          compact
        />
        <StatCell
          label={t(STAT_ITEMS[3].labelKey)}
          value={stats[STAT_ITEMS[3].key]}
          loading={loading}
          compact
        />
      </View>
    </View>
  );
}
