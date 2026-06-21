import "react-native-reanimated";
import "../global.css";
import "@/lib/i18n";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { useEffect } from "react";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

// 忽略特定的 Firebase 网络超时警告
LogBox.ignoreLogs([
  "Could not reach Cloud Firestore backend",
  "Firestore (12.6.0): Could not reach Cloud Firestore backend",
  "@firebase/firestore:",
]);

// 1. 引入我们刚才写的 AI 组件
// 注意：如果报错找不到文件，请检查文件名是否是 AIChat.tsx
import AIChat from "@/components/AIChat";

import { ActivationModal } from "@/components/license";
import { OtaUpdateModal } from "@/components/updates";
import { AuthProvider } from "@/context/auth";
import { LanguageProvider } from "@/context/language";
import { LicenseProvider } from "@/context/license";
import { MenuProvider } from "@/context/menu";
import { OtaUpdateProvider } from "@/context/ota-update";
import { StoreProvider } from "@/context/store";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RouteGuard() {
  useAuthRedirect();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Some environments (like Expo Go / stale dev clients) may not include this native module.
    void (async () => {
      try {
        const ScreenOrientation = await import("expo-screen-orientation");
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.warn("Screen orientation module unavailable:", error);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ flex: 1 }}>
      <AuthProvider>
        <StoreProvider>
          <LanguageProvider>
            <LicenseProvider>
              <MenuProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                  <OtaUpdateProvider>
                    <RouteGuard />
                    {/* 这里的 Stack 负责页面跳转 */}
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="select-store" />
                      <Stack.Screen name="pickup/new" />
                      <Stack.Screen
                        name="orders/[id]"
                        options={{ presentation: "modal" }}
                      />
                      <Stack.Screen name="analytics/index" />
                    </Stack>

                    {/* Activation Modal - 全局激活弹窗 */}
                    <ActivationModal />
                    <OtaUpdateModal />

                    {/* === 2. AI 悬浮球在这里！(全剧置顶) === */}
                    <AIChat />

                    <StatusBar style="auto" />
                  </OtaUpdateProvider>
                </ThemeProvider>
              </MenuProvider>
            </LicenseProvider>
          </LanguageProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
