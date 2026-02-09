import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";

type ColorMode = (typeof Colors)["light"];

type Preset = {
  label: string;
  startDate: string;
  endDate: string;
};

type DateRangeSelectorProps = {
  dateRange: { startDate: string; endDate: string };
  selectedPreset: string | null;
  presets: Preset[];
  colors: ColorMode;
  onPresetSelect: (label: string) => void;
  onDateChange: (range: { startDate: string; endDate: string }) => void;
};

export function DateRangeSelector({
  dateRange,
  selectedPreset,
  presets,
  colors,
  onPresetSelect,
  onDateChange,
}: DateRangeSelectorProps) {
  const responsive = useResponsiveLayout();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");
  const [tempDate, setTempDate] = useState(new Date());

  const handleDatePress = (mode: "start" | "end") => {
    setPickerMode(mode);
    const currentDateStr =
      mode === "start" ? dateRange.startDate : dateRange.endDate;
    const date = new Date(currentDateStr);
    setTempDate(!isNaN(date.getTime()) ? date : new Date());
    setShowPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === "android") {
        updateDate(selectedDate);
      } else {
        setTempDate(selectedDate);
      }
    }
  };

  const updateDate = (date: Date) => {
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    if (pickerMode === "start") {
      onDateChange({ ...dateRange, startDate: formattedDate });
    } else {
      onDateChange({ ...dateRange, endDate: formattedDate });
    }
  };

  return (
    <View className="gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Text style={{ fontSize: responsive.subheadingFontSize }} className="font-bold text-slate-900 dark:text-white">
        Date Range
      </Text>
      <View className="flex-row gap-3">
        <DateField
          label="Start Date"
          value={dateRange.startDate}
          colors={colors}
          onPress={() => handleDatePress("start")}
        />
        <DateField
          label="End Date"
          value={dateRange.endDate}
          colors={colors}
          onPress={() => handleDatePress("end")}
        />
      </View>
      <View className="flex-row flex-wrap gap-2">
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            onPress={() => onPresetSelect(preset.label)}
            className={`rounded-full border px-3 py-2 ${
              selectedPreset === preset.label
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedPreset === preset.label
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* iOS Modal Picker */}
      {Platform.OS === "ios" && (
        <Modal transparent visible={showPicker} animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/50 p-4">
            <View className="w-full max-w-sm rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="mb-4 flex-row justify-between">
                <Text className="text-lg font-semibold dark:text-white">
                  Select {pickerMode === "start" ? "Start" : "End"} Date
                </Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                textColor={colors.text}
              />
              <TouchableOpacity
                className="mt-4 rounded-lg bg-blue-600 py-3"
                onPress={() => {
                  updateDate(tempDate);
                  setShowPicker(false);
                }}
              >
                <Text className="text-center font-bold text-white">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Picker */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

function DateField({
  label,
  value,
  colors,
  onPress,
}: {
  label: string;
  value: string;
  colors: ColorMode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
    >
      <Text className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">
          {value}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.tabIconDefault}
        />
      </View>
    </TouchableOpacity>
  );
}
