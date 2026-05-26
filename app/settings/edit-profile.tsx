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

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState("John Smith");
  const [email, setEmail] = useState("john@restaurant.com");
  const [phone, setPhone] = useState("555-0123");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        t("common.success"),
        t("settings.editProfile.alertSaved")
      );
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={t("settings.editProfile.title")} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <Input
              label={t("settings.editProfile.fullName")}
              value={name}
              onChangeText={setName}
              placeholder={t("settings.editProfile.fullNamePlaceholder")}
            />

            <Input
              label={t("settings.editProfile.email")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("settings.editProfile.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={t("settings.editProfile.phone")}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("settings.editProfile.phonePlaceholder")}
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button
            label={t("common.saveChanges")}
            onPress={handleSave}
            loading={saving}
            disabled={!name || !email}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
