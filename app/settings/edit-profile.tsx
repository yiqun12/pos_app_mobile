import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/auth";
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
  const { user } = useAuth();

  const [name, setName] = useState(user?.email?.split("@")[0] ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // P1: implement profile update (Firebase Auth updateProfile + Firestore user doc).
      await new Promise((r) => setTimeout(r, 300));
      Alert.alert(
        t("common.success"),
        "Profile editing will be saved in P1."
      );
      router.back();
    } finally {
      setSaving(false);
    }
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
              editable={false}
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
