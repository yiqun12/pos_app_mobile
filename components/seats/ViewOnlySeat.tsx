import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { Seat } from "./types";

interface ViewOnlySeatProps {
  seat: Seat;
  onPress: (id: string) => void;
}

/**
 * ViewOnlySeat - A read-only seat component for canvas view
 * No drag, resize, rotate, or edit functionality
 * Only displays seat info and handles press navigation
 */
export const ViewOnlySeat: React.FC<ViewOnlySeatProps> = ({ seat, onPress }) => {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  
  // Use seat dimensions from Firebase if available, otherwise fall back to responsive default
  const seatWidth = seat.width || responsive.seatSize;
  const seatHeight = seat.height || responsive.seatSize;
  const minSide = Math.min(seatWidth, seatHeight);
  const isCircle = seat.type === "circle";

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const nameFontSize = Math.round(clamp(minSide * 0.34, 12, responsive.isTablet ? 20 : 18));
  const statusFontSize = Math.round(clamp(minSide * 0.19, 9, responsive.isTablet ? 12 : 10));
  const showStatusText = minSide >= 62;
  const nameLineHeight = Math.round(nameFontSize * 1.12);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "vacant":
        return {
          backgroundColor: "#966f33",
          borderColor: "#805c28",
        };
      case "reserved":
        return {
          backgroundColor: "#8c2828",
          borderColor: "#702020",
        };
      case "occupied":
        return {
          backgroundColor: "#00008b",
          borderColor: "#000066",
        };
      default:
        return {
          backgroundColor: "#966f33",
          borderColor: "#805c28",
        };
    }
  };

  const seatStyle = getStatusStyles(seat.status);
  const statusLabelMap: Record<Seat["status"], string> = {
    vacant: t("seats.legend.available"),
    reserved: t("seats.legend.reserved"),
    occupied: t("seats.legend.occupied"),
  };

  return (
    <View
      style={{
        width: seatWidth,
        height: seatHeight,
        position: "absolute",
        left: seat.x,
        top: seat.y,
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(seat.id)}
        activeOpacity={0.7}
        style={{
          borderRadius: isCircle ? minSide / 2 : responsive.seatBorderRadius,
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1, // Thinner border for cleaner look
          backgroundColor: seatStyle.backgroundColor,
          borderColor: seatStyle.borderColor,
        }}
        className="shadow-sm"
      >
        <Text
          style={{
            fontSize: nameFontSize,
            lineHeight: nameLineHeight,
            textAlign: "center",
            paddingHorizontal: 2,
            flexShrink: 0,
          }}
          className="font-bold text-white"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {seat.name}
        </Text>
        {showStatusText && seat.itemCount ? (
          <Text
            style={{
              fontSize: statusFontSize,
              marginTop: minSide < 72 ? 2 : responsive.isTablet ? 6 : 4,
              maxWidth: "100%",
              paddingHorizontal: 2,
            }}
            className="text-slate-200"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ×{seat.itemCount}
          </Text>
        ) : showStatusText ? (
          <Text
            style={{
              fontSize: statusFontSize,
              marginTop: minSide < 72 ? 2 : responsive.isTablet ? 6 : 4,
              maxWidth: "100%",
              paddingHorizontal: 2,
            }}
            className="text-slate-200 font-medium"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {statusLabelMap[seat.status]}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};
