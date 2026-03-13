import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoModeBanner } from "@/components/license";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/context/language";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { language } = useLanguage();
  const tabTitles =
    language === "zh"
      ? {
          seats: "座位",
          menu: "菜单",
          revenue: "营收",
          alerts: "通知",
          profile: "我的",
        }
      : {
          seats: "Seats",
          menu: "Menu",
          revenue: "Revenue",
          alerts: "Alerts",
          profile: "Profile",
        };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-slate-950">
      <SafeAreaView edges={["top"]} className="bg-white dark:bg-slate-950">
        {/* Demo Mode Banner - 在安全区下方显示 */}
        <DemoModeBanner />
      </SafeAreaView>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen
          name="seats"
          options={{
            title: tabTitles.seats,
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu/index"
          options={{
            title: tabTitles.menu,
            tabBarIcon: ({ color }) => (
              <Ionicons name="fast-food" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="revenue/index"
          options={{
            title: tabTitles.revenue,
            tabBarIcon: ({ color }) => (
              <Ionicons name="cash" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications/index"
          options={{
            title: tabTitles.alerts,
            tabBarIcon: ({ color }) => (
              <Ionicons name="notifications" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: tabTitles.profile,
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
