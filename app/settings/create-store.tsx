import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { createStore } from "@/lib/firestore/repositories/store";
import {
  fillAddressFromCurrentLocation,
  LocationAddressError,
} from "@/lib/pos/fillAddressFromLocation";
import { generateStoreId } from "@/lib/pos/generateStoreId";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

export default function CreateStoreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { storeList, setCurrentStoreId } = useStoreSelection();

  const [storeName, setStoreName] = useState("");
  const [storeNameCHI, setStoreNameCHI] = useState("");
  const [city, setCity] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRate, setTaxRate] = useState("8.875");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [fillingAddress, setFillingAddress] = useState(false);

  const existingStoreIds = useMemo(() => storeList.map((store) => store.id), [storeList]);

  const previewStoreId = useMemo(() => {
    if (!storeName.trim() || !city.trim() || !zipCode.trim()) return "";
    return (
      generateStoreId(
        { storeName, city, zipCode },
        existingStoreIds
      ) ?? ""
    );
  }, [city, existingStoreIds, storeName, zipCode]);

  const canSubmit =
    Boolean(storeName.trim())
    && Boolean(city.trim())
    && Boolean(stateField.trim())
    && Boolean(zipCode.trim())
    && Boolean(phone.trim())
    && Boolean(taxRate.trim());

  const handleCreate = async () => {
    if (!user) return;
    if (!canSubmit) {
      Alert.alert(t("common.error"), t("settings.store.createRequiredFields"));
      return;
    }

    setCreating(true);
    try {
      const storeId = await createStore(
        user.uid,
        {
          storeName: storeName.trim(),
          storeNameCHI: storeNameCHI.trim() || undefined,
          taxRate: taxRate.trim(),
          city: city.trim(),
          physicalAddress: physicalAddress.trim() || undefined,
          state: stateField.trim(),
          zipCode: zipCode.trim(),
          phone: phone.trim(),
          description: description.trim() || undefined,
        },
        existingStoreIds
      );

      await setCurrentStoreId(storeId);
      Alert.alert(t("common.success"), t("settings.store.createSuccess"), [
        {
          text: t("common.ok"),
          onPress: () => router.replace("/(tabs)/seats"),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "STORE_ID_EXISTS"
          ? t("settings.store.storeIdExists")
          : error instanceof Error && error.message === "STORE_ID_GENERATION_FAILED"
            ? t("settings.store.storeIdGenerationFailed")
            : t("settings.store.createFailed");
      Alert.alert(t("common.error"), message);
    } finally {
      setCreating(false);
    }
  };

  const handleAutoFillAddress = async () => {
    if (fillingAddress || creating) return;

    setFillingAddress(true);
    try {
      const address = await fillAddressFromCurrentLocation();
      if (address.city) setCity(address.city);
      if (address.physicalAddress) setPhysicalAddress(address.physicalAddress);
      if (address.state) setStateField(address.state);
      if (address.zipCode) setZipCode(address.zipCode);
      Alert.alert(t("common.success"), t("settings.store.autoFillAddressSuccess"));
    } catch (error) {
      const message =
        error instanceof LocationAddressError &&
        error.code === "PERMISSION_DENIED"
          ? t("settings.store.autoFillAddressPermissionDenied")
          : t("settings.store.autoFillAddressFailed");
      Alert.alert(t("common.error"), message);
    } finally {
      setFillingAddress(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("settings.store.createStore")}
        showBackButton
        rightElement={
          <TouchableOpacity
            onPress={handleAutoFillAddress}
            disabled={fillingAddress || creating}
            accessibilityRole="button"
            accessibilityLabel={t("settings.store.autoFillAddress")}
            className="flex-row items-center rounded-lg bg-slate-500 px-2.5 py-1.5 dark:bg-slate-600"
            style={{ opacity: fillingAddress || creating ? 0.6 : 1 }}
          >
            {fillingAddress ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="location" size={14} color="#ffffff" />
                <Text className="ml-1 max-w-[88px] text-[11px] font-semibold text-white">
                  {t("settings.store.autoFillAddress")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          <Text className="mb-4 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {t("settings.store.createStoreSubtitle")}
          </Text>

          {previewStoreId ? (
            <View className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/20">
              <Text className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                {t("settings.store.generatedStoreId")}
              </Text>
              <Text className="mt-1 font-mono text-sm text-slate-900 dark:text-white">
                {previewStoreId}
              </Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Input
              label={t("settings.store.storeName")}
              value={storeName}
              onChangeText={setStoreName}
              placeholder={t("settings.store.storeNamePlaceholder")}
            />
            <Input
              label={t("settings.store.storeNameChi")}
              value={storeNameCHI}
              onChangeText={setStoreNameCHI}
              placeholder={t("settings.store.storeNameChiPlaceholder")}
            />
            <Input
              label={t("settings.store.city")}
              value={city}
              onChangeText={setCity}
              placeholder={t("settings.store.cityPlaceholder")}
            />
            <Input
              label={t("settings.store.physicalAddress")}
              value={physicalAddress}
              onChangeText={setPhysicalAddress}
              placeholder={t("settings.store.physicalAddressPlaceholder")}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label={t("settings.store.state")}
                  value={stateField}
                  onChangeText={setStateField}
                  placeholder={t("settings.store.statePlaceholder")}
                  autoCapitalize="characters"
                />
              </View>
              <View className="flex-1">
                <Input
                  label={t("settings.store.zipCode")}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder={t("settings.store.zipCodePlaceholder")}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Input
              label={t("settings.store.phone")}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("settings.store.phonePlaceholder")}
              keyboardType="phone-pad"
            />
            <Input
              label={t("settings.store.taxRate")}
              value={taxRate}
              onChangeText={setTaxRate}
              placeholder={t("settings.store.taxRatePlaceholder")}
              keyboardType="decimal-pad"
            />
            <Input
              label={t("settings.store.description")}
              value={description}
              onChangeText={setDescription}
              placeholder={t("settings.store.descriptionPlaceholder")}
              multiline
            />
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button
            label={t("settings.store.createStore")}
            onPress={handleCreate}
            loading={creating}
            disabled={!canSubmit || creating}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
