import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoModeBanner } from "@/components/license";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
            title: "Seats",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu/index"
          options={{
            title: "Menu",
            tabBarIcon: ({ color }) => (
              <Ionicons name="fast-food" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="revenue/index"
          options={{
            title: "Revenue",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cash" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications/index"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color }) => (
              <Ionicons name="notifications" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
