import { SettingsItem, Store, StoreSelector } from "@/components/profile";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Mock data
const MOCK_USER = {
  name: "John Smith",
  email: "john@restaurant.com",
  avatar: null,
};

const MOCK_STORES: Store[] = [
  {
    id: "1",
    name: "Golden Dragon",
    nameCHI: "金龙餐厅",
    address: "123 Main St, San Francisco, CA",
  },
  {
    id: "2",
    name: "Lucky Star",
    nameCHI: "幸运星",
    address: "456 Oak Ave, Oakland, CA",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [currentStore, setCurrentStore] = useState<Store>(MOCK_STORES[0]);
  const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);
  const [language, setLanguage] = useState<"en" | "zh">("en");

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          // TODO: 实现登出逻辑
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const handleStoreSelect = (store: Store) => {
    setCurrentStore(store);
    setStoreSelectorVisible(false);
    // TODO: 切换店铺后的数据刷新逻辑
  };

  const handleCreateStore = () => {
    setStoreSelectorVisible(false);
    router.push("/settings/store-create");
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title="Profile"
        rightElement={
          <TouchableOpacity onPress={() => router.push("/test-firebase")}>
            <Ionicons name="flame" size={24} color={colors.tint} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View className="mx-4 mt-4 rounded-2xl bg-blue-600 p-5">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-blue-500">
              <Ionicons name="person" size={32} color="white" />
            </View>
            {/* User Details */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                {MOCK_USER.name}
              </Text>
              <Text className="mt-1 text-sm text-blue-200">
                {MOCK_USER.email}
              </Text>
            </View>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => router.push("/settings/edit-profile")}
              className="h-10 w-10 items-center justify-center rounded-full bg-blue-500"
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Store Card */}
        <TouchableOpacity
          onPress={() => setStoreSelectorVisible(true)}
          activeOpacity={0.7}
          className="mx-4 mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <View className="flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Ionicons name="storefront" size={24} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Current Store
              </Text>
              <Text className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
                {currentStore.name}
              </Text>
              {currentStore.nameCHI && (
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {currentStore.nameCHI}
                </Text>
              )}
            </View>
            <View className="flex-row items-center">
              <Text className="mr-1 text-sm text-blue-600 dark:text-blue-400">
                Switch
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Settings Section */}
        <View className="mx-4 mt-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Settings
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="lock-closed"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => router.push("/settings/change-password")}
            />

            <SettingsItem
              icon="globe"
              title="Language"
              subtitle="中文 / English"
              isSwitch
              switchValue={language === "zh"}
              onSwitchChange={(value) => setLanguage(value ? "zh" : "en")}
              showArrow={false}
            />
            <SettingsItem
              icon="settings"
              title="Store Settings"
              subtitle="Business hours, info & more"
              onPress={() => router.push("/settings/store")}
            />
            <SettingsItem
              icon="repeat"
              title="Test Fetch Firebase"
              subtitle="Fetch restaurant data from Firebase"
              onPress={() => router.push("/test-firebase")}
            />
            <SettingsItem
              icon="qr-code"
              title="QR Code Management"
              subtitle="Table QR codes for dine-in"
              onPress={() => router.push("/settings/qr-management")}
            />
            <SettingsItem
              icon="card"
              title="Payment Settings"
              subtitle="Stripe connection & terminals"
              onPress={() => router.push("/settings/payment")}
            />
          </View>
        </View>

        {/* Support Section */}
        <View className="mx-4 mt-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Support
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="help-circle"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="#9333ea"
              title="Help & FAQ"
              subtitle="Get help with common questions"
              onPress={() => Alert.alert("Help", "Navigate to help center")}
            />
            <SettingsItem
              icon="chatbubble-ellipses"
              iconBgColor="bg-teal-100 dark:bg-teal-900/30"
              iconColor="#14b8a6"
              title="Contact Support"
              subtitle="Reach our support team"
              onPress={() => Alert.alert("Support", "Contact support")}
            />
          </View>
        </View>

        {/* Account Section */}
        <View className="mx-4 mt-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Account
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="log-out"
              title="Sign Out"
              showArrow={false}
              danger
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* App Version */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-slate-400 dark:text-slate-500">
            7Dollar POS v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Store Selector Modal */}
      <StoreSelector
        visible={storeSelectorVisible}
        stores={MOCK_STORES}
        currentStoreId={currentStore.id}
        onSelect={handleStoreSelect}
        onClose={() => setStoreSelectorVisible(false)}
        onCreateStore={handleCreateStore}
      />
    </View>
  );
}
