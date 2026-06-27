import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  formatRevenueDisplayDate,
  getRevenueWindowForPreset,
  type RevenueBusinessDayWindow,
  type RevenueDatePreset,
} from "@/lib/pos/revenueBusinessDay";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

type RevenueDateRangeModalProps = {
  visible: boolean;
  colors: ColorMode;
  timeZone: string;
  selectedPreset: RevenueDatePreset;
  startDate: Date;
  endDate: Date | null;
  onClose: () => void;
  onApply: (payload: {
    preset: RevenueDatePreset;
    startDate: Date;
    endDate: Date | null;
    window: RevenueBusinessDayWindow;
  }) => void;
};

const QUARTER_PRESETS: RevenueDatePreset[] = [
  "q1",
  "q2",
  "q3",
  "q4",
  "lastQ1",
  "lastQ2",
  "lastQ3",
  "lastQ4",
];

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

function getDateTimePicker() {
  try {
    return require("@react-native-community/datetimepicker").default;
  } catch {
    return null;
  }
}

function ShortcutChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-xl border px-3 py-2.5 ${
        active
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40"
          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <Text
        numberOfLines={2}
        className={`text-center text-sm font-semibold ${
          active ? "text-orange-600 dark:text-orange-300" : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function RevenueDateRangeModal({
  visible,
  colors,
  timeZone,
  selectedPreset,
  startDate,
  endDate,
  onClose,
  onApply,
}: RevenueDateRangeModalProps) {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const DateTimePicker = getDateTimePicker();

  const [draftPreset, setDraftPreset] = useState<RevenueDatePreset>(selectedPreset);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(endDate);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end" | "month">("start");
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (!visible) return;
    setDraftPreset(selectedPreset);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
  }, [visible, selectedPreset, startDate, endDate]);

  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    return now.getMonth();
  }, []);

  const lastMonthIndex = (currentMonthIndex + 11) % 12;

  const openPicker = (mode: "start" | "end" | "month") => {
    if (!DateTimePicker) return;
    setPickerMode(mode);
    if (mode === "start") setTempDate(draftStartDate);
    else if (mode === "end") setTempDate(draftEndDate ?? draftStartDate);
    else setTempDate(draftStartDate);
    setShowPicker(true);
  };

  const applyCustomDates = (nextStart: Date, nextEnd: Date | null) => {
    setDraftPreset("custom");
    setDraftStartDate(nextStart);
    setDraftEndDate(nextEnd);
  };

  const handlePickerConfirm = () => {
    if (pickerMode === "start") {
      applyCustomDates(tempDate, draftEndDate);
    } else if (pickerMode === "end") {
      applyCustomDates(draftStartDate, tempDate);
    } else {
      const monthStart = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
      applyCustomDates(monthStart, null);
      setDraftPreset("custom");
    }
    setShowPicker(false);
  };

  const handleApply = () => {
    const window = getRevenueWindowForPreset(draftPreset, timeZone, new Date(), {
      start: draftStartDate,
      end: draftEndDate,
    });

    onApply({
      preset: draftPreset,
      startDate: draftStartDate,
      endDate: draftEndDate,
      window,
    });
  };

  const presetLabel = (preset: RevenueDatePreset) => {
    if (preset === "thisMonth") {
      return t(`revenue.monthOrders.${MONTH_KEYS[currentMonthIndex]}`);
    }
    if (preset === "lastMonth") {
      return t(`revenue.monthOrders.${MONTH_KEYS[lastMonthIndex]}`);
    }
    return t(`revenue.datePreset.${preset}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <View
          className="max-h-[88%] rounded-t-3xl bg-white dark:bg-slate-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Text
              style={{ fontSize: responsive.subheadingFontSize + 2 }}
              className="font-bold text-slate-900 dark:text-white"
            >
              {t("revenue.selectDateRange")}
            </Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-4 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: responsive.mediumSpacing, paddingBottom: 12 }}
          >
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("revenue.dateSection.quick")}
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ShortcutChip
                    label={presetLabel("today")}
                    active={draftPreset === "today"}
                    onPress={() => setDraftPreset("today")}
                  />
                </View>
                <View className="flex-1">
                  <ShortcutChip
                    label={presetLabel("yesterday")}
                    active={draftPreset === "yesterday"}
                    onPress={() => setDraftPreset("yesterday")}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("revenue.dateSection.month")}
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ShortcutChip
                    label={presetLabel("thisMonth")}
                    active={draftPreset === "thisMonth"}
                    onPress={() => setDraftPreset("thisMonth")}
                  />
                </View>
                <View className="flex-1">
                  <ShortcutChip
                    label={presetLabel("lastMonth")}
                    active={draftPreset === "lastMonth"}
                    onPress={() => setDraftPreset("lastMonth")}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("revenue.dateSection.quarter")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {QUARTER_PRESETS.map((preset) => (
                  <View key={preset} style={{ width: "48%" }}>
                    <ShortcutChip
                      label={presetLabel(preset)}
                      active={draftPreset === preset}
                      onPress={() => setDraftPreset(preset)}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("revenue.dateSection.custom")}
              </Text>
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => openPicker("start")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{t("revenue.start")}</Text>
                  <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {formatRevenueDisplayDate(draftStartDate, timeZone)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openPicker("end")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{t("revenue.end")}</Text>
                  <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {draftEndDate
                      ? formatRevenueDisplayDate(draftEndDate, timeZone)
                      : t("revenue.singleDayHint")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openPicker("month")}
                  className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-900"
                >
                  <Text className="text-sm font-semibold text-orange-600 dark:text-orange-300">
                    {t("revenue.selectMonth")}
                  </Text>
                </TouchableOpacity>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {t("revenue.customRangeHint")}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <TouchableOpacity
              onPress={handleApply}
              className="rounded-xl bg-orange-500 py-3.5"
            >
              <Text className="text-center text-base font-bold text-white">
                {t("revenue.applyRange")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {DateTimePicker && Platform.OS === "ios" && (
        <Modal transparent visible={showPicker} animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/50 p-4">
            <View className="w-full max-w-sm rounded-xl bg-white p-4 dark:bg-slate-900">
              <Text className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {pickerMode === "month"
                  ? t("revenue.selectMonth")
                  : t("revenue.selectDate", {
                      type: pickerMode === "start" ? t("revenue.start") : t("revenue.end"),
                    })}
              </Text>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={(_event: unknown, date?: Date) => date && setTempDate(date)}
                textColor={colors.text}
              />
              <View className="mt-4 flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  className="flex-1 rounded-lg bg-slate-100 py-3 dark:bg-slate-800"
                >
                  <Text className="text-center font-bold text-slate-900 dark:text-white">
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickerConfirm}
                  className="flex-1 rounded-lg bg-orange-600 py-3"
                >
                  <Text className="text-center font-bold text-white">{t("common.confirm")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {DateTimePicker && Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event: { type?: string }, date?: Date) => {
            setShowPicker(false);
            if (event.type === "dismissed" || !date) return;
            setTempDate(date);
            if (pickerMode === "start") applyCustomDates(date, draftEndDate);
            else if (pickerMode === "end") applyCustomDates(draftStartDate, date);
            else applyCustomDates(new Date(date.getFullYear(), date.getMonth(), 1), null);
          }}
        />
      )}

      {!DateTimePicker && (
        <Text className="px-4 pb-4 text-sm text-amber-600 dark:text-amber-400">
          {t("revenue.datePickerUnavailable")}
        </Text>
      )}
    </Modal>
  );
}
