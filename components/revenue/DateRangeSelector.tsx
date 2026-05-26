import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

function getDateTimePicker() {
  try {
    return require("@react-native-community/datetimepicker").default;
  } catch (error) {
    console.warn("DateTimePicker module unavailable:", error);
    return null;
  }
}

export function DateRangeSelector({
  dateRange,
  selectedPreset,
  presets,
  colors,
  onPresetSelect,
  onDateChange,
}: DateRangeSelectorProps) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const presetFontSize = isTablet ? 16 : 14;
  const dateRangeFontSize = isTablet ? 16 : 14;
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");
  const [tempDate, setTempDate] = useState(new Date());
  const DateTimePicker = getDateTimePicker();

  const visiblePresets = useMemo(() => {
    return presets
      .slice(0, 3)
      .map((preset, index) => {
        try {
          if (typeof preset?.label !== "string") return null;
          return { key: `preset-${index}-${preset.label}`, label: preset.label };
        } catch {
          return null;
        }
      })
      .filter((preset): preset is { key: string; label: string } => preset !== null);
  }, [presets]);

  // ... (handlers) ...
  const handleDatePress = (mode: "start" | "end") => {
    if (!DateTimePicker) return;
    setPickerMode(mode);
    setTempDate(mode === "start" ? new Date(dateRange.startDate) : new Date(dateRange.endDate));
    setShowPicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (date) updateDate(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const updateDate = (date: Date) => {
    // format date to string
    const formatted = date.toLocaleDateString('en-US'); // simple format
    const newRange = { ...dateRange };
    if (pickerMode === "start") newRange.startDate = formatted;
    else newRange.endDate = formatted;
    
    onDateChange(newRange);
  };

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-4 mb-4">
      <View
        style={{
          flexDirection: "row",
          borderRadius: 8,
          padding: 4,
          backgroundColor: colorSchemeBackground(colors),
        }}
      >
        {visiblePresets.map((preset) => (
          <TouchableOpacity
            key={preset.key}
            onPress={() => onPresetSelect(preset.label)}
            style={{
              borderRadius: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor:
                selectedPreset === preset.label
                  ? colorSchemeSurface(colors)
                  : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: presetFontSize,
                fontWeight: "500",
                color:
                  selectedPreset === preset.label
                    ? "#ea580c"
                    : colors.tabIconDefault,
              }}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
            onPress={() => handleDatePress("start")}
            style={{
              borderRadius: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: !selectedPreset ? colorSchemeSurface(colors) : "transparent",
            }}
        >
            <Text
              style={{
                fontSize: presetFontSize,
                fontWeight: "500",
                color: !selectedPreset ? "#ea580c" : colors.tabIconDefault,
              }}
            >
              {t("revenue.custom")}
            </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-2">
         <View 
            className="flex-row items-center border border-slate-200 rounded-xl px-4 bg-white dark:border-slate-800 dark:bg-slate-900"
            style={{ height: responsive.minTouchTargetSize }}
         >
            <Ionicons name="calendar-outline" size={isTablet ? 18 : 16} color={colors.text} />
            <Text
              className="ml-2 font-medium text-slate-700 dark:text-slate-300"
              style={{ fontSize: dateRangeFontSize }}
            >
                {dateRange.startDate} - {dateRange.endDate}
            </Text>
         </View>
         <Button
           label={t("revenue.exportReport")}
           icon="download"
           size="sm"
           variant="primary"
           onPress={() => {}}
         />
       </View>

       {!DateTimePicker && (
         <Text className="text-sm text-amber-600 dark:text-amber-400">
           {t("revenue.datePickerUnavailable")}
         </Text>
       )}

      {/* ... Pickers ... */}
      {DateTimePicker && Platform.OS === "ios" && (
        <Modal transparent visible={showPicker} animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/50 p-4">
            <View className="w-full max-w-sm rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="mb-4 flex-row justify-between">
                <Text className="text-lg font-semibold dark:text-white">
                  {t("revenue.selectDate", {
                    type:
                      pickerMode === "start"
                        ? t("revenue.start")
                        : t("revenue.end"),
                  })}
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
                className="mt-4 rounded-lg bg-orange-600 py-3"
                onPress={() => {
                  updateDate(tempDate);
                  setShowPicker(false);
                }}
              >
                <Text className="text-center font-bold text-white">
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Picker */}
      {DateTimePicker && Platform.OS === "android" && showPicker && (
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

function colorSchemeBackground(colors: ColorMode) {
  return colors.background === "#fff" ? "#f1f5f9" : "#1e293b";
}

function colorSchemeSurface(colors: ColorMode) {
  return colors.background === "#fff" ? "#ffffff" : "#334155";
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
