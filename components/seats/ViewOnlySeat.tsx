import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
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
  
  // Use seat dimensions from Firebase if available, otherwise fall back to responsive default
  const seatWidth = seat.width || responsive.seatSize;
  const seatHeight = seat.height || responsive.seatSize;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant":
        return "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600";
      case "reserved":
        return "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700";
      case "occupied":
        return "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700";
      default:
        return "bg-slate-200 dark:bg-slate-700";
    }
  };

  const statusColor = getStatusColor(seat.status);

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
          borderWidth: 2,
        }}
        className={`${statusColor} shadow-sm`}
      >
        <Text
          style={{
            fontSize: responsive.isTablet ? 20 : 18,
          }}
          className="font-bold text-slate-700 dark:text-slate-100"
        >
          {seat.name}
        </Text>
        {seat.itemCount ? (
          <Text
            style={{
              fontSize: responsive.isTablet ? 12 : 10,
              marginTop: responsive.isTablet ? 6 : 4,
            }}
            className="text-slate-500 dark:text-slate-400"
          >
            {seat.itemCount} items
          </Text>
        ) : (
          <Text
            style={{
              fontSize: responsive.isTablet ? 12 : 10,
              marginTop: responsive.isTablet ? 6 : 4,
            }}
            className="text-slate-400 dark:text-slate-500 font-medium uppercase"
          >
            {seat.status}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
