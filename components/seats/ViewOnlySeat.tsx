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

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const nameFontSize = Math.round(clamp(minSide * 0.34, 12, responsive.isTablet ? 20 : 18));
  const statusFontSize = Math.round(clamp(minSide * 0.19, 9, responsive.isTablet ? 12 : 10));
  const showStatusText = minSide >= 62;
  const nameLineHeight = Math.round(nameFontSize * 1.12);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant":
        return "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
      case "reserved":
        return "bg-orange-200 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700";
      case "occupied":
        return "bg-orange-600 dark:bg-orange-700 border-orange-700 dark:border-orange-800";
      default:
        return "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    }
  };

  const statusColor = getStatusColor(seat.status);
  const isOccupied = seat.status === "occupied";
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
          borderRadius: responsive.seatBorderRadius,
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1, // Thinner border for cleaner look
        }}
        className={`${statusColor} shadow-sm`}
      >
        <Text
          style={{
            fontSize: nameFontSize,
            lineHeight: nameLineHeight,
            textAlign: "center",
            paddingHorizontal: 2,
          }}
          className={`font-bold ${isOccupied ? "text-white" : "text-slate-800 dark:text-slate-100"}`}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          ellipsizeMode="tail"
        >
          {seat.name}
        </Text>
        {showStatusText && seat.itemCount ? (
          <Text
            style={{
              fontSize: statusFontSize,
              marginTop: minSide < 72 ? 2 : responsive.isTablet ? 6 : 4,
            }}
            className={`${isOccupied ? "text-orange-100" : "text-slate-500 dark:text-slate-400"}`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {t("seats.itemsCount", { count: seat.itemCount })}
          </Text>
        ) : showStatusText ? (
          <Text
            style={{
              fontSize: statusFontSize,
              marginTop: minSide < 72 ? 2 : responsive.isTablet ? 6 : 4,
            }}
            className={`${isOccupied ? "text-orange-100" : "text-slate-400 dark:text-slate-500"} font-medium uppercase`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {statusLabelMap[seat.status]}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};
