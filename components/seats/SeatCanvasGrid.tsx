import {
  SEAT_CANVAS_BACKGROUND,
  SEAT_GRID_LINE_COLOR,
  SEAT_GRID_SIZE,
} from "@/lib/pos/seatLayout";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line } from "react-native-svg";

interface SeatCanvasGridProps {
  width: number;
  height: number;
}

export function SeatCanvasGrid({ width, height }: SeatCanvasGridProps) {
  const lines = useMemo(() => {
    if (width <= 0 || height <= 0) return null;

    const vertical: React.ReactNode[] = [];
    const horizontal: React.ReactNode[] = [];

    for (let x = 0; x <= width; x += SEAT_GRID_SIZE) {
      vertical.push(
        <Line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke={SEAT_GRID_LINE_COLOR}
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= height; y += SEAT_GRID_SIZE) {
      horizontal.push(
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={SEAT_GRID_LINE_COLOR}
          strokeWidth={1}
        />
      );
    }

    return [...vertical, ...horizontal];
  }, [width, height]);

  if (!lines) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { width, height, backgroundColor: SEAT_CANVAS_BACKGROUND },
      ]}
    >
      <Svg width={width} height={height}>
        {lines}
      </Svg>
    </View>
  );
}
