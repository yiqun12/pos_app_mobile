import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddTableModalProps {
  visible: boolean;
  existingNames: string[];
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddTableModal({
  visible,
  existingNames,
  onClose,
  onAdd,
}: AddTableModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (!visible) return;
    setName("");
    setError(null);
  }, [visible]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("seats.admin.tableNameEmpty"));
      return;
    }
    if (existingNames.some((existing) => existing === trimmed)) {
      setError(t("seats.admin.tableNameDuplicate"));
      return;
    }
    onAdd(trimmed);
    setName("");
    setError(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center bg-black/60 p-4">
          <View className="w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {t("seats.admin.addTableTitle")}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full bg-slate-100 p-1 dark:bg-slate-800"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className="gap-3 p-4">
              <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("seats.admin.tableNameLabel")}
              </Text>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (error) setError(null);
                }}
                placeholder={t("seats.admin.tableNamePlaceholder")}
                placeholderTextColor="#94a3b8"
                autoFocus
                className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {error ? (
                <Text className="text-sm text-red-500">{error}</Text>
              ) : null}
              <View className="mt-2 flex-row justify-end gap-2">
                <Button variant="outline" label={t("common.cancel")} onPress={onClose} />
                <Button variant="primary" label={t("seats.admin.addTable")} onPress={handleAdd} />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
