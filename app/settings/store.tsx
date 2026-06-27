import { WorkingHoursEditor } from "@/components/profile/WorkingHoursEditor";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useStore } from "@/hooks/firestore/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StoreScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  const { data: store, loading, error } = useStore();

  // Local edit state mirrors store fields; writes are P1.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");
  const [openTimeRaw, setOpenTimeRaw] = useState("{}");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setPhone(store.phone);
    setAddressLine(store.address.line1);
    setStateField(store.address.state);
    setZip(store.address.zip);
    setDescription(store.description ?? "");
    setOpenTimeRaw(JSON.stringify(store.openHours));
  }, [store]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      Alert.alert(
        t("settings.store.notImplementedTitle"),
        t("settings.store.notImplementedMessage"),
        [{ text: t("common.ok") }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHoursChange = (value: string) => {
    setOpenTimeRaw(value);
  };

  const screenTitle = t("settings.store.editStore");

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title={screenTitle} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-4 text-slate-500">
            {t("settings.store.loadingStoreData")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title={screenTitle} showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.tint} />
          <Text className="mt-4 text-center font-semibold text-slate-900 dark:text-white">
            {t("settings.store.unableToLoadStore")}
          </Text>
          <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
            {error?.message ?? ""}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={screenTitle} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          style={{ padding: responsive.mediumSpacing }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col gap-4 md:flex-row">
            <View className="flex-1 gap-4">
              <View className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <View className="mb-6 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("settings.store.storeInformation")}
                  </Text>
                  <TouchableOpacity className="rounded-lg border border-slate-200 px-3 py-1 dark:border-slate-700">
                    <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("common.edit")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-6 flex-row items-start">
                  <View className="mr-4 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-100">
                    <Ionicons name="image-outline" size={32} color="#f97316" />
                  </View>
                  <View className="flex-1 gap-2">
                    <View>
                      <Text className="text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.storeName")}
                      </Text>
                      <Input
                        value={name}
                        onChangeText={setName}
                        placeholder={t("settings.store.storeNamePlaceholder")}
                        className="mb-0"
                      />
                    </View>
                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-xs font-bold uppercase text-slate-500">
                          {t("settings.store.taxRate")}
                        </Text>
                        <Text className="text-base font-medium text-slate-900 dark:text-white">
                          8.5%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                      {t("settings.store.address")}
                    </Text>
                    <Input
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder={t("settings.store.addressPlaceholder")}
                      className="mb-0"
                    />
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.phone")}
                      </Text>
                      <Text className="text-base font-medium text-slate-900 dark:text-white">
                        +1 (555) 000-1234
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.websiteUrl")}
                      </Text>
                      <Text className="text-base font-medium text-orange-600">
                        {t("settings.store.websiteExample")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  {t("settings.store.paymentIntegration")}
                </Text>
                <Text className="mb-4 text-slate-500">
                  {t("settings.store.paymentIntegrationSubtitle")}
                </Text>
                <Button
                  label={t("settings.store.connectWithStripe")}
                  icon="link"
                  className="border-indigo-600 bg-indigo-600"
                />
              </View>

              <View className="flex-row items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <View className="h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
                  <Ionicons name="qr-code" size={32} color="#334155" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("settings.store.storeQrCode")}
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {t("settings.store.storeQrCodeSubtitle")}
                  </Text>
                </View>
                <Button
                  label={t("settings.store.printQr")}
                  size="sm"
                  variant="secondary"
                  icon="print"
                />
              </View>
            </View>

            <View className="flex-1 gap-4">
              <View className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Text className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                  {t("settings.store.businessHours")}
                </Text>
                <Text className="mb-6 text-sm text-slate-500">
                  {t("settings.store.businessHoursSubtitle")}
                </Text>

                <WorkingHoursEditor
                  initialValue={openTimeRaw}
                  onChange={handleWorkingHoursChange}
                />

                <Button
                  label={t("settings.store.applyToAllDays")}
                  variant="secondary"
                  className="mt-4 border-orange-100 bg-orange-50 text-orange-600"
                />
              </View>

              <View className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  {t("settings.store.security")}
                </Text>
                <Text className="mb-4 text-slate-500">
                  {t("settings.store.securitySubtitle")}
                </Text>
                <Button
                  label={t("settings.store.resetPassword")}
                  variant="outline"
                  className="w-full"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          className="border-t border-slate-200 dark:border-slate-800"
          style={{ padding: responsive.mediumSpacing }}
        >
          <Button
            label={t("common.saveChanges")}
            onPress={handleSave}
            loading={saving}
            disabled={!name}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
