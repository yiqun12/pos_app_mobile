import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useStore } from "@/hooks/firestore/useStore";
import { updateStore } from "@/lib/firestore/repositories/store";
import { defaultMenuUrl } from "@/lib/pos/storeSettings";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QRManagementScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store, loading, error } = useStore();

  const [saving, setSaving] = useState(false);
  const [menuUrl, setMenuUrl] = useState("");

  useEffect(() => {
    if (!store) return;
    setMenuUrl(store.menuUrl?.trim() || defaultMenuUrl(store.id));
  }, [store]);

  const handleSave = async () => {
    if (!user?.uid || !currentStoreId) {
      Alert.alert(t("common.error"), t("profile.noStoreSelected"));
      return;
    }

    const trimmedUrl = menuUrl.trim();
    if (!trimmedUrl) {
      Alert.alert(t("common.error"), t("settings.qr.menuUrlPlaceholder"));
      return;
    }

    setSaving(true);
    try {
      await updateStore(user.uid, currentStoreId, { menuUrl: trimmedUrl });
      Alert.alert(t("common.success"), t("settings.qr.updateSuccess"));
    } catch (err) {
      console.error("Failed to save QR settings:", err);
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("settings.qr.updateFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-white dark:bg-slate-950"
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !store) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-white dark:bg-slate-950"
      >
        <ScreenHeader title={t("settings.qr.title")} showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={48} color="#f97316" />
          <Text className="mt-4 text-center font-semibold text-slate-900 dark:text-white">
            {t("settings.qr.loadFailed")}
          </Text>
          {error ? (
            <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
              {error.message}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={t("settings.qr.title")} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          contentContainerClassName="pb-10"
        >
          <View className="items-center justify-center py-8">
            <View className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-none dark:bg-white">
              {menuUrl ? (
                <QRCode
                  value={menuUrl}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <View className="h-[200px] w-[200px] items-center justify-center bg-slate-100">
                  <Ionicons name="qr-code-outline" size={64} color="#94a3b8" />
                </View>
              )}
            </View>
            <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("settings.qr.scanHint")}
            </Text>
            <Text className="mt-2 text-center text-xs text-slate-400">
              {store.name}
            </Text>
          </View>

          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("settings.qr.menuUrlLabel")}
              </Text>
              <Input
                value={menuUrl}
                onChangeText={setMenuUrl}
                placeholder={t("settings.qr.menuUrlPlaceholder")}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text className="mt-1 text-xs text-slate-400">
                {t("settings.qr.menuUrlHelp")}
              </Text>
            </View>

            <View className="mt-4">
              <Button
                label={
                  saving
                    ? t("settings.qr.saving")
                    : t("settings.qr.saveButton")
                }
                onPress={handleSave}
                loading={saving}
                disabled={saving || !menuUrl.trim()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
