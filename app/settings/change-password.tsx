import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(
        t("common.error"),
        t("settings.changePassword.passwordMismatch")
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        t("common.error"),
        t("settings.changePassword.passwordTooShort")
      );
      return;
    }

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        t("common.success"),
        t("settings.changePassword.passwordUpdated")
      );
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={t("settings.changePassword.title")} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <Input
              label={t("settings.changePassword.currentPassword")}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t("settings.changePassword.currentPasswordPlaceholder")}
              secureTextEntry
            />

            <View className="h-4" />

            <Input
              label={t("settings.changePassword.newPassword")}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t("settings.changePassword.newPasswordPlaceholder")}
              secureTextEntry
            />

            <Input
              label={t("settings.changePassword.confirmNewPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("settings.changePassword.confirmNewPasswordPlaceholder")}
              secureTextEntry
            />
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button
            label={t("settings.changePassword.updateButton")}
            onPress={handleSave}
            loading={saving}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
