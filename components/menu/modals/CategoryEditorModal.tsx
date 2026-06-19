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
  initialNameCN?: string;
  saving?: boolean;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (payload: { name: string; nameCN?: string }) => Promise<void> | void;
}

export function CategoryEditorModal({
  visible,
  initialName = "",
  initialNameCN = "",
  saving = false,
  mode,
  onClose,
  onSave,
}: CategoryEditorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const [name, setName] = useState(initialName);
  const [nameCN, setNameCN] = useState(initialNameCN);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setNameCN(initialNameCN);
    }
  }, [visible, initialName, initialNameCN]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), nameCN: nameCN.trim() || undefined });
      onClose();
    } finally {
      setSubmitting(false);
    }
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
          <View className="w-full max-w-[560px] self-center rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add"
                  ? t("menu.category.addCategory")
                  : t("menu.category.editCategory")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View>
                <Text className="mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                  {t("menu.category.categoryName")}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{
                    height: 46,
                    lineHeight: 18,
                    paddingBottom: 0,
                    paddingTop: 0,
                    textAlignVertical: "center",
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder={t("menu.category.categoryNamePlaceholder")}
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
              </View>

              <View>
                <Text className="mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                  Chinese Category Name
                </Text>
                <TextInput
                  value={nameCN}
                  onChangeText={setNameCN}
                  style={{
                    height: 46,
                    lineHeight: 18,
                    paddingBottom: 0,
                    paddingTop: 0,
                    textAlignVertical: "center",
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder="Chinese Category Name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View className="mt-1 flex-row gap-3">
                <View className="flex-1">
                  <Button label={t("common.cancel")} variant="outline" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button
                    label={submitting || saving ? "Saving..." : t("common.save")}
                    onPress={handleSave}
                    disabled={!name.trim() || submitting || saving}
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
