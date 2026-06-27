import { DemoModeBanner } from "@/components/license";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import {
  createAppleRawNonce,
  formatAppleFullName,
} from "@/lib/auth/appleSignInUtils";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
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

const googleAuthConfig =
  (Constants.expoConfig?.extra as
    | { googleAuth?: { webClientId?: string; iosClientId?: string } }
    | undefined)?.googleAuth ?? {};

const googleClientIdConfigured =
  !!googleAuthConfig.webClientId &&
  !googleAuthConfig.webClientId.startsWith("REPLACE_WITH_");

if (googleClientIdConfigured) {
  GoogleSignin.configure({
    webClientId: googleAuthConfig.webClientId!,
    iosClientId: googleAuthConfig.iosClientId || undefined,
    offlineAccess: false,
  });
}

export default function LoginScreen() {
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const { t, i18n } = useTranslation();
  const { login, signInAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  // Suppress unused import warnings if Google flow isn't taken (kept for clarity).
  useEffect(() => {
    void statusCodes;
    void isErrorWithCode;
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== "ios") return;

    AppleAuthentication.isAvailableAsync()
      .then((isAvailable) => {
        if (isMounted) setAppleSignInAvailable(isAvailable);
      })
      .catch(() => {
        if (isMounted) setAppleSignInAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      await login(email, password);
      router.replace("/(tabs)/seats");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError(t("auth.invalidCredentials"));
      } else if (code === "auth/network-request-failed") {
        setError(t("auth.networkError"));
      } else {
        setError(err?.message ?? t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleClientIdConfigured) {
      setError(t("auth.googleNotConfigured"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      // google-signin v13+: result is { type: "success", data: {...} } | { type: "cancelled" }
      // older: returns userInfo directly
      const idToken =
        (result as any)?.data?.idToken ??
        (result as any)?.idToken ??
        null;

      if (!idToken) {
        const cancelled =
          (result as any)?.type === "cancelled" ||
          (result as any)?.type === "noSavedCredentialFound";
        if (cancelled) {
          setError("");
        } else {
          setError(t("auth.googleSignInFailed"));
        }
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      router.replace("/(tabs)/seats");
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled — silent.
          return;
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Google Play Services not available.");
          return;
        }
      }
      setError(err?.message ?? t("auth.googleSignInFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const rawNonce = createAppleRawNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        setError(t("auth.appleMissingToken"));
        return;
      }

      const provider = new OAuthProvider("apple.com");
      const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      const displayName = formatAppleFullName(appleCredential.fullName);
      if (displayName && !userCredential.user.displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      router.replace("/(tabs)/seats");
    } catch (err: any) {
      if (
        err?.code === "ERR_REQUEST_CANCELED" ||
        err?.code === "ERR_CANCELED" ||
        err?.code === "ERR_CANCELED_BY_USER"
      ) {
        return;
      }
      if (err?.code === "auth/network-request-failed") {
        setError(t("auth.networkError"));
      } else {
        setError(err?.message ?? t("auth.appleSignInFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : undefined;
      if (code === "auth/operation-not-allowed") {
        setError(t("auth.guestSignInDisabled"));
      } else if (code === "auth/network-request-failed") {
        setError(t("auth.networkError"));
      } else {
        setError(t("auth.guestSignInFailed"));
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
          <View className="mb-8 flex-row justify-end">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setLanguage("en")}
                className={`rounded-l-lg px-3 py-1.5 ${
                  i18n.language === "en"
                    ? "bg-orange-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    i18n.language === "en"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguage("zh")}
                className={`rounded-r-lg px-3 py-1.5 ${
                  i18n.language === "zh"
                    ? "bg-orange-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    i18n.language === "zh"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  CH
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

            {appleSignInAvailable ? (
              <View className="mb-3 overflow-hidden rounded-xl">
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={12}
                  style={{ width: "100%", height: 52, opacity: loading ? 0.55 : 1 }}
                  onPress={handleAppleSignIn}
                />
              </View>
            ) : null}

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
            <TouchableOpacity onPress={() => router.push("/sign-up" as any)}>
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
