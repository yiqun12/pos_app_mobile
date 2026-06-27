import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DailyRevenuePoint } from "@/lib/pos/revenueTransforms";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

type RevenueLineChartModalProps = {
  visible: boolean;
  colors: ColorMode;
  data: DailyRevenuePoint[];
  rangeLabel: string;
  rangeDates: string;
  loading?: boolean;
  onClose: () => void;
};

const CHART_COLOR = "#8884d8";

export function RevenueLineChartModal({
  visible,
  colors,
  data,
  rangeLabel,
  rangeDates,
  loading = false,
  onClose,
}: RevenueLineChartModalProps) {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const chartWidth = responsive.screenWidth - 48;
  const chartHeight = responsive.isTablet ? 260 : 220;
  const padding = { top: 20, right: 16, bottom: 36, left: 44 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const chart = useMemo(() => {
    if (data.length === 0) {
      return {
        points: "",
        dots: [] as { x: number; y: number; item: DailyRevenuePoint }[],
        maxValue: 0,
      };
    }

    const maxValue = Math.max(...data.map((item) => item.revenue), 1);
    const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

    const coords = data.map((item, index) => {
      const x = padding.left + stepX * index;
      const y = padding.top + innerHeight - (item.revenue / maxValue) * innerHeight;
      return { x, y, item };
    });

    return {
      points: coords.map((point) => `${point.x},${point.y}`).join(" "),
      dots: coords,
      maxValue,
    };
  }, [data, innerHeight, innerWidth, padding.left, padding.top]);

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
                  {rangeLabel}
                </Text>
                <Text
                  style={{ fontSize: responsive.subheadingFontSize, marginTop: 4 }}
                  className="font-medium text-orange-600 dark:text-orange-400"
                >
                  {rangeDates}
                </Text>
                <Text
                  style={{ fontSize: responsive.captionFontSize + 1, marginTop: 6 }}
                  className="text-slate-500 dark:text-slate-400"
                >
                  {t("revenue.chartDailyBreakdown")}
                  {data.length > 1 ? ` · ${data.length} ${t("revenue.chartDays")}` : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text className="py-10 text-center text-slate-500">{t("common.loading")}</Text>
            ) : data.length === 0 ? (
              <Text className="py-10 text-center text-slate-500 dark:text-slate-400">
                {t("revenue.noChartData")}
              </Text>
            ) : (
              <>
                <Svg width={chartWidth} height={chartHeight}>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + innerHeight * (1 - ratio);
                    const value = chart.maxValue * ratio;
                    return (
                      <React.Fragment key={ratio}>
                        <Line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + innerWidth}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth={1}
                        />
                        <SvgText
                          x={padding.left - 8}
                          y={y + 4}
                          fontSize={10}
                          fill="#64748b"
                          textAnchor="end"
                        >
                          {value >= 1000 ? `${Math.round(value / 100) / 10}k` : Math.round(value)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {chart.points ? (
                    <Polyline
                      points={chart.points}
                      fill="none"
                      stroke={CHART_COLOR}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ) : null}

                  {chart.dots.map((dot, index) => {
                    const labelEvery = chart.dots.length > 10 ? Math.ceil(chart.dots.length / 6) : 1;
                    const showLabel =
                      index === 0
                      || index === chart.dots.length - 1
                      || index % labelEvery === 0;

                    return (
                    <React.Fragment key={`${dot.item.date}-${index}`}>
                      <Circle cx={dot.x} cy={dot.y} r={dot.item.revenue > 0 ? 4 : 2} fill={CHART_COLOR} opacity={dot.item.revenue > 0 ? 1 : 0.35} />
                      {showLabel ? (
                      <SvgText
                        x={dot.x}
                        y={chartHeight - 8}
                        fontSize={10}
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {dot.item.date}
                      </SvgText>
                      ) : null}
                    </React.Fragment>
                    );
                  })}
                </Svg>

                <View className="mt-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  {data.filter((item) => item.revenue > 0).length === 0 ? (
                    <Text className="py-2 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t("revenue.noChartData")}
                    </Text>
                  ) : (
                    data
                      .filter((item) => item.revenue > 0)
                      .map((item) => (
                    <View
                      key={item.date}
                      className="flex-row items-center justify-between border-b border-slate-100 py-2 last:border-b-0 dark:border-slate-800"
                    >
                      <Text className="font-medium text-slate-700 dark:text-slate-200">{item.date}</Text>
                      <Text className="font-bold text-slate-900 dark:text-white">
                        ${item.revenue.toFixed(2)}
                      </Text>
                    </View>
                      ))
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
