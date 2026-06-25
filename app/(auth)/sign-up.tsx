import { DemoModeBanner } from "@/components/license";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/auth";
import { validateSignUpForm } from "@/lib/auth/signUpValidation";
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

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSignUp = async () => {
    setError("");
    const nextErrors = validateSignUpForm({ email, password, confirmPassword });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp(email, password);
      router.replace("/select-store");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "auth/email-already-in-use") {
        setFieldErrors({ email: "auth.emailAlreadyInUse" });
      } else if (code === "auth/weak-password") {
        setFieldErrors({ password: "auth.passwordMinLength" });
      } else if (code === "auth/network-request-failed") {
        setError(t("auth.networkError"));
      } else {
        setError(err?.message ?? t("auth.signUpFailed"));
      }
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
              <Ionicons name="restaurant" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("auth.createAccount")}
            </Text>
            <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
              {t("auth.signUpSubtitle")}
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
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              error={fieldErrors.email ? t(fieldErrors.email) : undefined}
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
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              error={fieldErrors.password ? t(fieldErrors.password) : undefined}
              isPassword
            />

            <Input
              label={t("auth.confirmPassword")}
              icon="lock-closed"
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
              error={
                fieldErrors.confirmPassword
                  ? t(fieldErrors.confirmPassword)
                  : undefined
              }
              isPassword
            />

            <Button
              label={t("auth.createAccountButton")}
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              className="mb-5"
              size="lg"
            />

            <View className="flex-row items-center justify-center">
              <Text className="text-slate-500 dark:text-slate-400">
                {t("auth.haveAccount")}{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="font-semibold text-orange-600 dark:text-orange-400">
                  {t("auth.signInButton")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
