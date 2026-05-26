import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { Seat, SeatStatus } from "./types";

interface SeatsGridProps {
  seats: Seat[];
  onSeatPress: (seatId: string) => void;
}

export function SeatsGrid({ seats, onSeatPress }: SeatsGridProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const getStatusColor = (status: SeatStatus) => {
    switch (status) {
      case "vacant":
        return "bg-slate-300";
      case "reserved":
        return "bg-yellow-400";
      case "occupied":
        return "bg-red-500";
      default:
        return "bg-slate-300";
    }
  };

  return (
    <View className="flex-row flex-wrap justify-between">
      {seats.map((seat) => (
        <TouchableOpacity
          key={seat.id}
          className={`mb-4 aspect-square w-[30%] items-center justify-center rounded-lg border-2 border-blue-500 ${getStatusColor(
            seat.status
          )}`}
          onPress={() => onSeatPress(seat.id)}
        >
          <Text style={{ fontSize: responsive.subheadingFontSize }} className="font-bold text-black">{seat.name}</Text>
          {seat.itemCount !== undefined && (
            <Text style={{ fontSize: responsive.captionFontSize }} className="mt-1 text-black">
              {t("seats.itemsCount", { count: seat.itemCount })}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
