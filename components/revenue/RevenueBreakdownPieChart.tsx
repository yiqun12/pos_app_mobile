import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { RevenueBreakdownSummary } from "@/lib/pos/revenueTransforms";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

type RevenueBreakdownPieChartProps = {
  revenueBreakdown: RevenueBreakdownSummary;
  loading?: boolean;
};

type Point = {
  x: number;
  y: number;
};

const styles = StyleSheet.create({
  container: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    paddingBottom: 20,
  },
  content: {
    gap: 16,
  },
  tabletContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  legend: {
    flex: 1,
  },
  revenueBlock: {
    marginBottom: 12,
  },
  eyebrow: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  revenueValue: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  legendRows: {
    gap: 8,
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendLabel: {
    color: "#334155",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  legendValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    width: 80,
  },
  legendPercent: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    width: 48,
  },
});

function polarToCartesian(center: number, radius: number, angle: number): Point {
  const radians = (angle - 90) * Math.PI / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function describePieSlice(center: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function RevenueBreakdownPieChart({
  revenueBreakdown,
  loading = false,
}: RevenueBreakdownPieChartProps) {
  const responsive = useResponsiveLayout();
  const isTablet = responsive.isTablet;
  const chartSize = isTablet ? 230 : 190;
  const center = chartSize / 2;
  const radius = isTablet ? 88 : 72;
  const labelRadius = radius * 0.58;
  const visibleItems = revenueBreakdown.items.filter((item) => item.value > 0);
  const hasData = revenueBreakdown.totalParts > 0 && visibleItems.length > 0;

  const slices = useMemo(() => {
    let cursor = 0;
    return visibleItems.map((item) => {
      const angle = item.percentage / 100 * 360;
      const startAngle = cursor;
      const endAngle = cursor + angle;
      cursor = endAngle;
      const labelPoint = polarToCartesian(center, labelRadius, startAngle + angle / 2);

      return {
        ...item,
        startAngle,
        endAngle,
        labelPoint,
      };
    });
  }, [center, labelRadius, visibleItems]);

  return (
    <View style={styles.container}>
      <View style={isTablet ? styles.tabletContent : styles.content}>
        <View style={[styles.chartWrap, { width: chartSize, height: chartSize, alignSelf: isTablet ? "auto" : "center" }]}>
          {loading ? (
            <Text style={styles.mutedText}>Loading...</Text>
          ) : !hasData ? (
            <Text style={styles.mutedText}>
              No Business Data
            </Text>
          ) : (
            <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
              <G>
                {slices.length === 1 ? (
                  <Circle cx={center} cy={center} r={radius} fill={slices[0].color} />
                ) : (
                  slices.map((slice) => (
                    <Path
                      key={slice.key}
                      d={describePieSlice(center, radius, slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))
                )}
                {slices.map((slice) => (
                  slice.percentage >= 5 ? (
                    <SvgText
                      key={`${slice.key}-label`}
                      x={slice.labelPoint.x}
                      y={slice.labelPoint.y}
                      fill="#ffffff"
                      fontSize={isTablet ? 12 : 11}
                      fontWeight="700"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {`${slice.percentage.toFixed(0)}%`}
                    </SvgText>
                  ) : null
                ))}
              </G>
            </Svg>
          )}
        </View>

        <View style={styles.legend}>
          <View style={styles.revenueBlock}>
            <Text style={styles.eyebrow}>
              Revenue
            </Text>
            <Text style={styles.revenueValue}>
              {loading ? "..." : formatMoney(revenueBreakdown.totalRevenue)}
            </Text>
          </View>

          <View style={styles.legendRows}>
            {revenueBreakdown.items.map((item) => (
              <View key={item.key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text numberOfLines={1} style={styles.legendLabel}>
                  {item.label}
                </Text>
                <Text style={styles.legendValue}>
                  {formatMoney(item.value)}
                </Text>
                <Text style={styles.legendPercent}>
                  {`${item.percentage.toFixed(0)}%`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
