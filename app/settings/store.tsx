import { WorkingHoursEditor } from "@/components/profile/WorkingHoursEditor";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useStore } from "@/hooks/firestore/useStore";
import { updateStore } from "@/lib/firestore/repositories/store";
import {
  applyMondayHoursToAllDays,
  editorOpenHoursToWeb,
  webOpenHoursToEditor,
} from "@/lib/pos/openHoursTransform";
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
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  const { data: store, loading, error } = useStore();

  const [name, setName] = useState("");
  const [nameCN, setNameCN] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [openTimeRaw, setOpenTimeRaw] = useState("{}");
  const [existingWebOpenHours, setExistingWebOpenHours] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setNameCN(store.nameCN ?? "");
    setPhone(store.phone);
    setAddressLine(store.address.line1);
    setPhysicalAddress(store.address.physical);
    setStateField(store.address.state);
    setZip(store.address.zip);
    setDescription(store.description ?? "");
    setTaxRate(String(store.taxRate || ""));
    setExistingWebOpenHours(store.openHours);
    setOpenTimeRaw(JSON.stringify(webOpenHoursToEditor(store.openHours)));
  }, [store]);

  const handleSave = async () => {
    if (!user?.uid || !currentStoreId) {
      Alert.alert(t("common.error"), t("profile.noStoreSelected"));
      return;
    }

    if (!name.trim()) {
      Alert.alert(t("common.error"), t("settings.store.createRequiredFields"));
      return;
    }

    setSaving(true);
    try {
      let editorHours: Record<string, string> = {};
      try {
        editorHours = JSON.parse(openTimeRaw) as Record<string, string>;
      } catch {
        editorHours = webOpenHoursToEditor(existingWebOpenHours);
      }

      await updateStore(user.uid, currentStoreId, {
        name: name.trim(),
        nameCN: nameCN.trim(),
        phone: phone.trim(),
        address: {
          line1: addressLine.trim(),
          physical: physicalAddress.trim() || addressLine.trim(),
          state: stateField.trim(),
          zip: zip.trim(),
        },
        description: description.trim(),
        taxRate: taxRate.trim() || "0",
        openHours: editorOpenHoursToWeb(editorHours, existingWebOpenHours),
      });

      Alert.alert(
        t("common.success"),
        t("settings.store.saveSuccess", { action: t("settings.store.updated") })
      );
    } catch (err) {
      console.error("Failed to save store settings:", err);
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("settings.store.updateFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHoursChange = (value: string) => {
    setOpenTimeRaw(value);
  };

  const handleApplyToAllDays = () => {
    try {
      const editorHours = JSON.parse(openTimeRaw) as Record<string, string>;
      setOpenTimeRaw(JSON.stringify(applyMondayHoursToAllDays(editorHours)));
    } catch {
      setOpenTimeRaw(JSON.stringify(applyMondayHoursToAllDays(webOpenHoursToEditor(existingWebOpenHours))));
    }
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
                <Text className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
                  {t("settings.store.storeInformation")}
                </Text>

                <View className="mb-6 flex-row items-start">
                  <View className="mr-4 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-100">
                    <Ionicons name="image-outline" size={32} color="#f97316" />
                  </View>
                  <View className="flex-1 gap-3">
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
                    <View>
                      <Text className="text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.storeNameChi")}
                      </Text>
                      <Input
                        value={nameCN}
                        onChangeText={setNameCN}
                        placeholder={t("settings.store.storeNameChiPlaceholder")}
                        className="mb-0"
                      />
                    </View>
                  </View>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                      {t("settings.store.city")}
                    </Text>
                    <Input
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder={t("settings.store.cityPlaceholder")}
                      className="mb-0"
                    />
                  </View>
                  <View>
                    <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                      {t("settings.store.physicalAddress")}
                    </Text>
                    <Input
                      value={physicalAddress}
                      onChangeText={setPhysicalAddress}
                      placeholder={t("settings.store.physicalAddressPlaceholder")}
                      className="mb-0"
                    />
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.state")}
                      </Text>
                      <Input
                        value={stateField}
                        onChangeText={setStateField}
                        placeholder={t("settings.store.statePlaceholder")}
                        className="mb-0"
                        autoCapitalize="characters"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.zipCode")}
                      </Text>
                      <Input
                        value={zip}
                        onChangeText={setZip}
                        placeholder={t("settings.store.zipCodePlaceholder")}
                        className="mb-0"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.phone")}
                      </Text>
                      <Input
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t("settings.store.phonePlaceholder")}
                        className="mb-0"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {t("settings.store.taxRate")}
                      </Text>
                      <Input
                        value={taxRate}
                        onChangeText={setTaxRate}
                        placeholder={t("settings.store.taxRatePlaceholder")}
                        className="mb-0"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                      {t("settings.store.description")}
                    </Text>
                    <Input
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t("settings.store.descriptionPlaceholder")}
                      className="mb-0"
                      multiline
                    />
                  </View>
                </View>
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
                  label={t("common.edit")}
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push("/settings/qr-management")}
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
                  onPress={handleApplyToAllDays}
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
            disabled={!name.trim() || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
