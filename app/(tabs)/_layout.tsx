import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoModeBanner } from "@/components/license";
import { BottomTabTokens, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const tabSizeKey = responsive.isTablet ? "tablet" : "phone";
  const tabTokens = BottomTabTokens[tabSizeKey];

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-slate-950">
      <SafeAreaView edges={["top"]} className="bg-white dark:bg-slate-950">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
      </SafeAreaView>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: {
            height: tabTokens.barHeight,
            paddingTop: tabTokens.paddingTop,
            paddingBottom: tabTokens.paddingBottom,
            paddingHorizontal: tabTokens.paddingHorizontal,
          },
          tabBarItemStyle: {
            paddingVertical: tabTokens.itemPaddingVertical,
            minHeight: tabTokens.itemMinHeight,
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarLabelPosition: "beside-icon",
          tabBarAllowFontScaling: true,
          tabBarLabelStyle: {
            fontSize: tabTokens.labelFontSize,
            lineHeight: tabTokens.labelLineHeight,
            fontWeight: "600",
            textAlign: "left",
          },
          tabBarIconStyle: {
            marginRight: tabTokens.iconMarginRight,
          },
        }}
      >
        <Tabs.Screen
          name="seats"
          options={{
            title: t("tabs.seats"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={tabTokens.iconSize} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu/index"
          options={{
            title: t("tabs.menu"),
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="fast-food"
                size={tabTokens.iconSize}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="revenue/index"
          options={{
            title: t("tabs.revenue"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="cash" size={tabTokens.iconSize} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications/index"
          options={{
            title: t("tabs.alerts"),
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="notifications"
                size={tabTokens.iconSize}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="person"
                size={tabTokens.iconSize}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
