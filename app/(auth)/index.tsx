import { DemoModeBanner } from "@/components/license";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/context/language";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSignIn = async () => {
    setError("");
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email || !validateEmail(email)) {
      setEmailError(t("auth.invalidEmail"));
      hasError = true;
    }
    if (!password) {
      setPasswordError(t("auth.passwordRequired"));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      // TODO: call real login API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.replace("/(tabs)/seats");
    } catch (_err) {
      setError(t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // TODO: implement Google sign in
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(tabs)/seats");
    } catch (_err) {
      setError(t("auth.googleSignInFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      // TODO: implement guest sign in
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.replace("/(tabs)/seats");
    } catch (_err) {
      setError(t("auth.guestSignInFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <SafeAreaView edges={["top"]} className="bg-white dark:bg-slate-950">
        <DemoModeBanner />
      </SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 flex-row justify-end">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setLanguage("en")}
                className={`rounded-l-lg px-3 py-1.5 ${
                  language === "en"
                    ? "bg-orange-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    language === "en"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {t("common.english")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguage("zh")}
                className={`rounded-r-lg px-3 py-1.5 ${
                  language === "zh"
                    ? "bg-orange-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    language === "zh"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {t("common.chinese")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
              <Ionicons name="restaurant" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("auth.welcomeBack")}
            </Text>
            <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
              {t("auth.subtitle")}
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <Text className="text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mb-6">
            <Input
              label={t("auth.email")}
              icon="mail"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label={t("auth.password")}
              icon="lock-closed"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
              error={passwordError}
              isPassword
            />

            <TouchableOpacity className="mb-6 self-end">
              <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {t("auth.forgotPassword")}
              </Text>
            </TouchableOpacity>

            <Button
              label={t("auth.signInButton")}
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              className="mb-4"
              size="lg"
            />

            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <Text className="mx-4 text-sm text-slate-400">{t("common.or")}</Text>
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </View>

            <Button
              label={t("auth.googleSignIn")}
              onPress={handleGoogleSignIn}
              variant="outline"
              icon="logo-google"
              className="mb-3"
              size="lg"
              disabled={loading}
            />

            <Button
              label={t("auth.guestSignIn")}
              onPress={handleGuestSignIn}
              variant="secondary"
              icon="person"
              size="lg"
              disabled={loading}
            />
          </View>

          <View className="flex-row items-center justify-center">
            <Text className="text-slate-500 dark:text-slate-400">
              {t("auth.noAccount")} {" "}
            </Text>
            <TouchableOpacity>
              <Text className="font-semibold text-orange-600 dark:text-orange-400">
                {t("auth.signUp")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
