import { DemoModeBanner } from "@/components/license";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/context/language";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const translations = {
  en: {
    signIn: "Sign In",
    email: "Email Address",
    password: "Password",
    signInButton: "Sign In",
    googleSignIn: "Continue with Google",
    guestSignIn: "Guest Sign In",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    welcomeBack: "Welcome Back (TEST APP)",
    subtitle: "Sign in to manage your restaurant",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    invalidEmail: "Please enter a valid email",
    passwordRequired: "Password is required",
  },
  zh: {
    signIn: "登录",
    email: "电子邮箱",
    password: "密码",
    signInButton: "登录",
    googleSignIn: "使用 Google 登录",
    guestSignIn: "访客登录",
    forgotPassword: "忘记密码？",
    noAccount: "还没有账号？",
    signUp: "注册",
    welcomeBack: "欢迎回来 (TEST APP)",
    subtitle: "登录以管理您的餐厅",
    emailPlaceholder: "请输入邮箱",
    passwordPlaceholder: "请输入密码",
    invalidEmail: "请输入有效的邮箱地址",
    passwordRequired: "请输入密码",
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language, setLanguage } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const t = useMemo(() => translations[language], [language]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    // Reset errors
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate
    let hasError = false;
    if (!email || !validateEmail(email)) {
      setEmailError(t.invalidEmail);
      hasError = true;
    }
    if (!password) {
      setPasswordError(t.passwordRequired);
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      // TODO: 调用实际的登录API
      // await login(email, password);
      
      // 模拟登录延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // 登录成功后跳转到主页
      router.replace("/(tabs)/seats");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // TODO: 实现 Google 登录
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(tabs)/seats");
    } catch (err) {
      setError("Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      // TODO: 实现访客登录
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.replace("/(tabs)/seats");
    } catch (err) {
      setError("Guest sign in failed.");
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
          {/* Language Toggle */}
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
                    language === "en" ? "text-white" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  EN
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
                    language === "zh" ? "text-white" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  中文
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logo & Title */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
              <Ionicons name="restaurant" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {t.welcomeBack}
            </Text>
            <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
              {t.subtitle}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <Text className="text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="mb-6">
            <Input
              label={t.email}
              icon="mail"
              placeholder={t.emailPlaceholder}
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
              label={t.password}
              icon="lock-closed"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
              error={passwordError}
              isPassword
            />

            {/* Forgot Password */}
            <TouchableOpacity className="mb-6 self-end">
              <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {t.forgotPassword}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              label={t.signInButton}
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              className="mb-4"
              size="lg"
            />

            {/* Divider */}
            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <Text className="mx-4 text-sm text-slate-400">or</Text>
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </View>

            {/* Google Sign In */}
            <Button
              label={t.googleSignIn}
              onPress={handleGoogleSignIn}
              variant="outline"
              icon="logo-google"
              className="mb-3"
              size="lg"
              disabled={loading}
            />

            {/* Guest Sign In */}
            <Button
              label={t.guestSignIn}
              onPress={handleGuestSignIn}
              variant="secondary"
              icon="person"
              size="lg"
              disabled={loading}
            />
          </View>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-slate-500 dark:text-slate-400">
              {t.noAccount}{" "}
            </Text>
            <TouchableOpacity>
              <Text className="font-semibold text-orange-600 dark:text-orange-400">
                {t.signUp}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
