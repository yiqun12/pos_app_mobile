import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";

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

export function WorkingHoursEditor({
  initialValue,
  onChange,
}: WorkingHoursEditorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [modalVisible, setModalVisible] = useState(false);
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
    if (!value || value === "Closed")
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
    setHours((prev) => ({
      ...prev,
      [day]:
        type === "open" ? `${time}-${close}` : `${open}-${time}`,
    }));
  };

  const toggleDay = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]:
        prev[day] && prev[day] !== "Closed"
          ? "Closed"
          : `${DEFAULT_OPEN}-${DEFAULT_CLOSE}`,
    }));
  };

  const summary = useMemo(() => {
    const count = Object.values(hours).filter((v) => v !== "Closed").length;
    return count ? `${count} days configured` : "Not set";
  }, [hours]);

  /* ---------- Save ---------- */
  const handleSave = () => {
    onChange(JSON.stringify(hours));
    setModalVisible(false);
  };

  /* ---------- Render ---------- */
  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        Operating Hours
      </Text>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
      >
        <Text
          numberOfLines={1}
          className="flex-1 text-slate-900 dark:text-white"
        >
          {summary}
        </Text>
        <Ionicons name="pencil" size={16} color={colors.tint} />
      </TouchableOpacity>

      {/* ---------- Main Modal ---------- */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white dark:bg-slate-950">
          <View className="flex-row items-center justify-between border-b p-4 dark:border-slate-800">
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-slate-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold dark:text-white">Edit Hours</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text className="font-semibold text-blue-600">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 pt-4">
            {SHORT_DAYS.map((day) => {
              const { isOpen, open, close } = parseDay(hours[day]);

              return (
                <View
                  key={day}
                  className="mb-4 rounded-xl border p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="font-semibold dark:text-white">
                      {DAY_MAP[day]}
                    </Text>
                    <Switch
                      value={isOpen}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ false: "#e2e8f0", true: colors.tint }}
                    />
                  </View>

                  <View className="flex-row gap-3 opacity-100">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-slate-500">Open</Text>
                      <TouchableOpacity
                        disabled={!isOpen}
                        onPress={() =>
                          setPicker({ visible: true, day, mode: "open" })
                        }
                        className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <Text className="text-center font-semibold dark:text-white">
                          {isOpen ? open : "--"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-slate-500">Close</Text>
                      <TouchableOpacity
                        disabled={!isOpen}
                        onPress={() =>
                          setPicker({ visible: true, day, mode: "close" })
                        }
                        className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <Text className="text-center font-semibold dark:text-white">
                          {isOpen ? close : "--"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ---------- Time Picker ---------- */}
      <Modal visible={picker.visible} transparent animationType="slide">
        <View className="flex-1 bg-black/50">
          <View className="absolute bottom-0 w-full rounded-t-2xl bg-white dark:bg-slate-900">
            <View className="flex-row justify-between border-b p-4 dark:border-slate-800">
              <TouchableOpacity onPress={() => setPicker({ visible: false })}>
                <Text className="text-slate-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const h = String(selectedDate.getHours()).padStart(2, "0");
                  const m = String(selectedDate.getMinutes()).padStart(2, "0");
                  picker.day &&
                    picker.mode &&
                    updateDay(picker.day, picker.mode, `${h}:${m}`);
                  setPicker({ visible: false });
                }}
              >
                <Text className="font-semibold text-blue-600">Done</Text>
              </TouchableOpacity>
            </View>

            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              mode="time"
              is24hourSource="locale"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}