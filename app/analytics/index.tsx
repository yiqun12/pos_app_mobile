import { AnalyticsTable, ItemAnalytic, StatCard } from "@/components/analytics";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEM_ANALYTICS: ItemAnalytic[] = [
  {
    name: "Eel Claypot Crispy Rice",
    quantitySold: 12,
    totalRevenue: 189.6,
    averagePrice: 15.8,
    trend: "up",
  },
  {
    name: "Hot And Spicy Sichuan Style Chicken",
    quantitySold: 8,
    totalRevenue: 135.6,
    averagePrice: 16.95,
    trend: "up",
  },
  {
    name: "Garlic Romaine Lettuce (A choy)",
    quantitySold: 6,
    totalRevenue: 90.0,
    averagePrice: 15.0,
    trend: "stable",
  },
  {
    name: "Beef Rice Noodle Rolls",
    quantitySold: 5,
    totalRevenue: 34.0,
    averagePrice: 6.8,
    trend: "down",
  },
  {
    name: "3pc Leek and Pork Dumplings",
    quantitySold: 4,
    totalRevenue: 28.8,
    averagePrice: 7.2,
    trend: "up",
  },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const totalItems = ITEM_ANALYTICS.length;
    const totalQuantity = ITEM_ANALYTICS.reduce(
      (sum, item) => sum + item.quantitySold,
      0
    );
    const totalRevenue = ITEM_ANALYTICS.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );

    return { totalItems, totalQuantity, totalRevenue };
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-950"
      edges={["top", "bottom", "left", "right"]}
    >
      <View className="flex-1">
        <ScreenHeader
          title={t("analytics.title")}
          rightElement={
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          }
        />

        {/* Content */}
        <ScrollView
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-4"
        >
          {/* Stats Cards */}
          <View className="mb-4 gap-3">
            <View className="flex-row gap-3">
              <StatCard
                title={t("analytics.totalItems")}
                value={stats.totalItems.toString()}
                icon="cube"
                bgColor="bg-blue-100"
                textColor="text-blue-600"
                darkBg="dark:bg-blue-950"
                darkText="dark:text-blue-400"
              />
              <StatCard
                title={t("analytics.totalQty")}
                value={stats.totalQuantity.toString()}
                icon="layers"
                bgColor="bg-green-100"
                textColor="text-green-600"
                darkBg="dark:bg-green-950"
                darkText="dark:text-green-400"
              />
            </View>

            <StatCard
              title={t("analytics.totalRevenue")}
              value={`$${stats.totalRevenue.toFixed(2)}`}
              icon="cash"
              bgColor="bg-purple-100"
              textColor="text-purple-600"
              darkBg="dark:bg-purple-950"
              darkText="dark:text-purple-400"
              fullWidth
            />
          </View>

          <AnalyticsTable data={ITEM_ANALYTICS} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Subcomponents removed (StatCard, TrendIcon) as they are now imported
