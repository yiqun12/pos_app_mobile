import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import type { Store } from "@/lib/firestore/types";
import { registerTerminal } from "@/lib/pos/terminalCore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type RegisterTerminalModalProps = {
  visible: boolean;
  uid: string;
  store: Store;
  onClose: () => void;
  onRegistered: () => void;
};

export function RegisterTerminalModal({
  visible,
  uid,
  store,
  onClose,
  onRegistered,
}: RegisterTerminalModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [storeDisplayName, setStoreDisplayName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStoreDisplayName(store.name);
    setStreetAddress(store.address.physical || store.address.line1);
    setCity(store.address.line1);
    setStateField(store.address.state);
    setZipCode(store.address.zip);
    setRegistrationCode("");
  }, [visible, store]);

  const handleRegister = async () => {
    if (!registrationCode.trim()) {
      Alert.alert(t("common.error"), t("settings.payment.registrationCodeRequired"));
      return;
    }

    setRegistering(true);
    try {
      await registerTerminal({
        uid,
        storeId: store.id,
        store,
        registrationCode,
        storeDisplayName,
        streetAddress,
        city,
        state: stateField,
        zipCode,
      });
      Alert.alert(t("common.success"), t("settings.payment.registerSuccess"));
      onRegistered();
      onClose();
    } catch (err) {
      console.error("Failed to register terminal:", err);
      const message =
        err instanceof Error && err.message === "TERMINAL_ALREADY_EXISTS"
          ? t("settings.payment.terminalAlreadyExists")
          : err instanceof Error
            ? err.message
            : t("settings.payment.registerFailed");
      Alert.alert(t("common.error"), message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="max-h-[90%] rounded-t-3xl bg-white dark:bg-slate-950"
        >
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {t("settings.payment.registerTerminalTitle")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 py-4" keyboardShouldPersistTaps="handled">
            <View className="gap-3">
              <View>
                <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                  {t("settings.store.storeName")}
                </Text>
                <Input value={storeDisplayName} onChangeText={setStoreDisplayName} className="mb-0" />
              </View>
              <View>
                <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                  {t("settings.store.physicalAddress")}
                </Text>
                <Input value={streetAddress} onChangeText={setStreetAddress} className="mb-0" />
              </View>
              <View>
                <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                  {t("settings.store.city")}
                </Text>
                <Input value={city} onChangeText={setCity} className="mb-0" />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                    {t("settings.store.state")}
                  </Text>
                  <Input
                    value={stateField}
                    onChangeText={setStateField}
                    className="mb-0"
                    autoCapitalize="characters"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                    {t("settings.store.zipCode")}
                  </Text>
                  <Input
                    value={zipCode}
                    onChangeText={setZipCode}
                    className="mb-0"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View>
                <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                  {t("settings.payment.registrationCodeLabel")}
                </Text>
                <Input
                  value={registrationCode}
                  onChangeText={setRegistrationCode}
                  placeholder={t("settings.payment.registrationCodePlaceholder")}
                  className="mb-0"
                  autoCapitalize="none"
                />
                <Text className="mt-1 text-xs text-slate-400">
                  {t("settings.payment.registrationCodeHelp")}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
            <Button
              label={
                registering
                  ? t("settings.payment.registering")
                  : t("settings.payment.registerTerminalButton")
              }
              onPress={handleRegister}
              loading={registering}
              disabled={registering}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
