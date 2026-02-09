import "react-native-reanimated";
import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ActivationModal } from "@/components/license";
import { AuthProvider } from "@/context/auth";
import { LicenseProvider } from "@/context/license";
import { MenuProvider } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LicenseProvider>
        <MenuProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pickup/new" />
              <Stack.Screen
                name="orders/[id]"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="analytics/index" />
            </Stack>
            {/* Activation Modal - 全局弹窗 */}
            <ActivationModal />
            <StatusBar style="auto" />
          </ThemeProvider>
        </MenuProvider>
      </LicenseProvider>
    </AuthProvider>
  );
}
