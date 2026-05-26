import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WorkingHoursEditorProps {
  initialValue: string | Record<string, string>;
  onChange: (value: string) => void;
}

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_MAP: Record<(typeof SHORT_DAYS)[number], string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "22:00";

function getDateTimePicker() {
  try {
    return require("@react-native-community/datetimepicker").default;
  } catch (error) {
    console.warn("DateTimePicker module unavailable:", error);
    return null;
  }
}

export function WorkingHoursEditor({
  initialValue,
  onChange,
}: WorkingHoursEditorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();
  const DateTimePicker = getDateTimePicker();

  const [hours, setHours] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<{
    visible: boolean;
    day?: string;
    mode?: "open" | "close";
  }>({ visible: false });

  const [selectedDate, setSelectedDate] = useState(new Date());

  /* ---------- Init ---------- */
  useEffect(() => {
    try {
      setHours(
        typeof initialValue === "string"
          ? JSON.parse(initialValue)
          : initialValue ?? {}
      );
    } catch {
      setHours({});
    }
  }, [initialValue]);

  /* ---------- Helpers ---------- */
   const parseDay = (value?: string) => {
    if (
      !value ||
      value === "Closed" ||
      value === t("workingHours.closed")
    )
      return { isOpen: false, open: "", close: "" };

    const [open = DEFAULT_OPEN, close = DEFAULT_CLOSE] = value
      .replace("–", "-")
      .split("-")
      .map((v) => v.trim());

    return { isOpen: true, open, close };
  };

  const updateDay = (
    day: string,
    type: "open" | "close",
    time: string
  ) => {
    const { open, close } = parseDay(hours[day]);
    setHours((prev) => {
      const newHours = {
        ...prev,
        [day]:
          type === "open" ? `${time}-${close}` : `${open}-${time}`,
      };
      onChange(JSON.stringify(newHours)); // Auto-save on change
      return newHours;
    });
  };

  const toggleDay = (day: string) => {
    setHours((prev) => {
      const newHours = {
        ...prev,
        [day]:
          prev[day] && prev[day] !== "Closed"
            ? t("workingHours.closed")
            : `${DEFAULT_OPEN}-${DEFAULT_CLOSE}`,
      };
      onChange(JSON.stringify(newHours)); // Auto-save on change
      return newHours;
    });
  };

  /* ---------- Render ---------- */
  return (
    <View>
        {/* Render each day row directly inline instead of modal for better UX on tablet */}
        {SHORT_DAYS.map((day) => {
            const { isOpen, open, close } = parseDay(hours[day]);
            return (
                <View key={day} className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <View className="flex-row items-center gap-4">
                        <Switch
                            value={isOpen}
                            onValueChange={() => toggleDay(day)}
                            trackColor={{ false: "#e2e8f0", true: "#F97316" }}
                            thumbColor={"#fff"}
                        />
                        <Text className="font-medium text-slate-900 w-24 dark:text-white">{DAY_MAP[day]}</Text>
                    </View>
                    
                    {isOpen ? (
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity 
                                onPress={() => setPicker({ visible: true, day, mode: "open" })}
                                className="bg-slate-50 border border-slate-200 rounded px-3 py-1 dark:bg-slate-800 dark:border-slate-700"
                            >
                                <Text className="text-slate-900 dark:text-white">{open}</Text>
                            </TouchableOpacity>
                            <Text className="text-slate-400">~</Text>
                            <TouchableOpacity 
                                onPress={() => setPicker({ visible: true, day, mode: "close" })}
                                className="bg-slate-50 border border-slate-200 rounded px-3 py-1 dark:bg-slate-800 dark:border-slate-700"
                            >
                                <Text className="text-slate-900 dark:text-white">{close}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text className="text-slate-400 text-sm italic mr-4">
                          {t("workingHours.closed")}
                        </Text>
                    )}
                </View>
            );
        })}

        {/* ---------- Time Picker ---------- */}
        {!DateTimePicker && (
            <Text className="py-3 text-sm text-amber-600 dark:text-amber-400">
                {t("workingHours.pickerUnavailable")}
            </Text>
        )}

        {DateTimePicker && Platform.OS === "ios" && (
            <Modal visible={picker.visible} transparent animationType="fade">
                <View className="flex-1 bg-black/50 items-center justify-center p-4">
                    <View className="w-full max-w-sm bg-white rounded-xl p-4 dark:bg-slate-900">
                        <DateTimePicker
                            value={selectedDate}
                            onChange={(_event: unknown, date?: Date) =>
                              setSelectedDate(date || selectedDate)
                            }
                            mode="time"
                            display="spinner"
                            textColor={colors.text}
                        />
                        <Button label={t("common.done")} onPress={() => {
                            const h = String(selectedDate.getHours()).padStart(2, "0");
                            const m = String(selectedDate.getMinutes()).padStart(2, "0");
                            picker.day && picker.mode && updateDay(picker.day, picker.mode, `${h}:${m}`);
                            setPicker({ visible: false });
                        }} />
                    </View>
                </View>
            </Modal>
        )}

        {DateTimePicker && Platform.OS === "android" && picker.visible && (
            <DateTimePicker
                value={selectedDate}
                mode="time"
                display="default"
                onChange={(_event: unknown, date?: Date) => {
                    setPicker({ visible: false });
                    if (date) {
                        const h = String(date.getHours()).padStart(2, "0");
                        const m = String(date.getMinutes()).padStart(2, "0");
                        picker.day && picker.mode && updateDay(picker.day, picker.mode, `${h}:${m}`);
                    }
                }}
            />
        )}
    </View>
  );
}
