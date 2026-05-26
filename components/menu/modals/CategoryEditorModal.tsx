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

interface CategoryEditorModalProps {
  visible: boolean;
  initialName?: string;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (name: string) => void;
}

export function CategoryEditorModal({
  visible,
  initialName = "",
  mode,
  onClose,
  onSave,
}: CategoryEditorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
  }, [visible, initialName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add"
                  ? t("menu.category.addCategory")
                  : t("menu.category.editCategory")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                  {t("menu.category.categoryName")}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder={t("menu.category.categoryNamePlaceholder")}
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
              </View>

              <View className="mt-2 flex-row gap-3">
                <View className="flex-1">
                  <Button label={t("common.cancel")} variant="outline" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button
                    label={t("common.save")}
                    onPress={handleSave}
                    disabled={!name.trim()}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
