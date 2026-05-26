import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useStore } from "@/hooks/firestore/useStore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestFirebaseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: store, loading, error } = useStore();

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-slate-950"
        edges={["top", "left", "right", "bottom"]}
      >
        <ScreenHeader title="Firebase Test" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-4 text-slate-500">Fetching store data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title="Firebase Test" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-red-500">{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title="Firebase Test" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500">No store selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Firebase Test" />
      <ScrollView className="flex-1 px-4 py-4">
        <View className="mb-6 flex-row items-start gap-4">
          {store.image ? (
            <Image
              source={{ uri: store.image }}
              style={{ width: 100, height: 100, borderRadius: 8 }}
            />
          ) : null}
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {store.name}
            </Text>
            {store.nameCN ? (
              <Text className="text-lg text-slate-700 dark:text-slate-300">
                {store.nameCN}
              </Text>
            ) : null}
            {store.description ? (
              <Text className="text-slate-500">{store.description}</Text>
            ) : null}
          </View>
        </View>

        <View className="mb-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <Text className="mb-2 font-semibold text-slate-900 dark:text-white">
            Contact & Location
          </Text>
          <Text className="text-slate-600 dark:text-slate-400">
            Phone: {store.phone}
          </Text>
          <Text className="text-slate-600 dark:text-slate-400">
            Address: {store.address.line1}
          </Text>
          <Text className="text-slate-600 dark:text-slate-400">
            {store.address.physical}, {store.address.state} {store.address.zip}
          </Text>
          <Text className="text-slate-600 dark:text-slate-400">
            Tax Rate: {store.taxRate}%
          </Text>
        </View>

        <Text className="font-semibold text-slate-900 dark:text-white">
          Categories ({store.menu.categories.length})
        </Text>
        <View className="mb-4 rounded bg-slate-100 p-2 dark:bg-slate-800">
          <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {JSON.stringify(store.menu.categories, null, 2)}
          </Text>
        </View>

        <Text className="font-semibold text-slate-900 dark:text-white">
          Menu Items (first 5 of {store.menu.items.length})
        </Text>
        <View className="mb-4 rounded bg-slate-100 p-2 dark:bg-slate-800">
          <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {JSON.stringify(store.menu.items.slice(0, 5), null, 2)}
          </Text>
        </View>

        <Text className="font-semibold text-slate-900 dark:text-white">Open Hours</Text>
        <View className="mb-4 rounded bg-slate-100 p-2 dark:bg-slate-800">
          <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {JSON.stringify(store.openHours, null, 2)}
          </Text>
        </View>

        <Text className="font-semibold text-slate-900 dark:text-white">
          Seat Layout ({store.seatLayout.tables.length} tables)
        </Text>
        <View className="mb-10 rounded bg-slate-100 p-2 dark:bg-slate-800">
          <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {JSON.stringify(store.seatLayout, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
