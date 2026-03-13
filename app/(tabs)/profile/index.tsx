import { SettingsItem, Store, StoreSelector } from "@/components/profile";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/context/language";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
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
  const responsive = useResponsiveLayout();
  const isTablet = responsive.isTablet;
  const userNameFontSize = isTablet ? 34 : 20;
  const userEmailFontSize = isTablet ? 18 : 14;
  const storeLabelFontSize = isTablet ? 14 : 12;
  const storeNameFontSize = isTablet ? 24 : 16;
  const storeNameChiFontSize = isTablet ? 17 : 14;
  const storeSwitchFontSize = isTablet ? 16 : 14;
  const sectionTitleFontSize = isTablet ? 16 : 14;
  const versionFontSize = isTablet ? 15 : 14;
  const { language, setLanguage } = useLanguage();
  const t =
    language === "zh"
      ? {
          profile: "我的",
          currentStore: "当前门店",
          switch: "切换",
          settings: "设置",
          changePassword: "修改密码",
          updatePassword: "更新您的密码",
          language: "语言",
          languageSubtitle: "中文 / English",
          storeSettings: "门店设置",
          storeSettingsSubtitle: "营业时间、门店信息等",
          testFetchFirebase: "测试获取 Firebase",
          testFetchFirebaseSubtitle: "从 Firebase 拉取餐厅数据",
          qrCodeManagement: "二维码管理",
          qrCodeManagementSubtitle: "堂食桌台二维码",
          paymentSettings: "支付设置",
          paymentSettingsSubtitle: "Stripe 连接与终端",
          support: "支持",
          helpFaq: "帮助与常见问题",
          helpFaqSubtitle: "查看常见问题帮助",
          contactSupport: "联系支持",
          contactSupportSubtitle: "联系支持团队",
          account: "账户",
          signOut: "退出登录",
          signOutTitle: "退出登录",
          signOutMessage: "确定要退出当前账号吗？",
          cancel: "取消",
          version: "7Dollar POS v1.0.0",
        }
      : {
          profile: "Profile",
          currentStore: "Current Store",
          switch: "Switch",
          settings: "Settings",
          changePassword: "Change Password",
          updatePassword: "Update your password",
          language: "Language",
          languageSubtitle: "中文 / English",
          storeSettings: "Store Settings",
          storeSettingsSubtitle: "Business hours, info & more",
          testFetchFirebase: "Test Fetch Firebase",
          testFetchFirebaseSubtitle: "Fetch restaurant data from Firebase",
          qrCodeManagement: "QR Code Management",
          qrCodeManagementSubtitle: "Table QR codes for dine-in",
          paymentSettings: "Payment Settings",
          paymentSettingsSubtitle: "Stripe connection & terminals",
          support: "Support",
          helpFaq: "Help & FAQ",
          helpFaqSubtitle: "Get help with common questions",
          contactSupport: "Contact Support",
          contactSupportSubtitle: "Reach our support team",
          account: "Account",
          signOut: "Sign Out",
          signOutTitle: "Sign Out",
          signOutMessage: "Are you sure you want to sign out?",
          cancel: "Cancel",
          version: "7Dollar POS v1.0.0",
        };

  const [currentStore, setCurrentStore] = useState<Store>(MOCK_STORES[0]);
  const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(t.signOutTitle, t.signOutMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
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
        title={t.profile}
        rightElement={
          <TouchableOpacity onPress={() => router.push("/test-firebase")}>
            <Ionicons name="flame" size={24} color={colors.tint} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: responsive.mediumSpacing,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View className="mt-4 rounded-2xl bg-orange-500 p-5 shadow-sm">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="person" size={32} color="white" />
            </View>
            {/* User Details */}
            <View className="flex-1">
              <Text className="font-bold text-white" style={{ fontSize: userNameFontSize }}>
                {MOCK_USER.name}
              </Text>
              <Text
                className="mt-1 text-orange-100"
                style={{ fontSize: userEmailFontSize }}
              >
                {MOCK_USER.email}
              </Text>
            </View>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => router.push("/settings/edit-profile")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Store Card */}
        <TouchableOpacity
          onPress={() => setStoreSelectorVisible(true)}
          activeOpacity={0.7}
          className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <View className="flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Ionicons name="storefront" size={24} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text
                className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                style={{ fontSize: storeLabelFontSize }}
              >
                {t.currentStore}
              </Text>
              <Text
                className="mt-0.5 font-semibold text-slate-900 dark:text-white"
                style={{ fontSize: storeNameFontSize }}
              >
                {currentStore.name}
              </Text>
              {currentStore.nameCHI && (
                <Text
                  className="text-slate-500 dark:text-slate-400"
                  style={{ fontSize: storeNameChiFontSize }}
                >
                  {currentStore.nameCHI}
                </Text>
              )}
            </View>
            <View className="flex-row items-center">
              <Text
                className="mr-1 text-orange-600 dark:text-orange-400"
                style={{ fontSize: storeSwitchFontSize }}
              >
                {t.switch}
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color="#f97316" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Settings Section */}
        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t.settings}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="lock-closed"
              title={t.changePassword}
              subtitle={t.updatePassword}
              onPress={() => router.push("/settings/change-password")}
            />

            <SettingsItem
              icon="globe"
              title={t.language}
              subtitle={t.languageSubtitle}
              isSwitch
              switchValue={language === "zh"}
              onSwitchChange={(value) => setLanguage(value ? "zh" : "en")}
              showArrow={false}
            />
            <SettingsItem
              icon="settings"
              title={t.storeSettings}
              subtitle={t.storeSettingsSubtitle}
              onPress={() => router.push("/settings/store")}
            />
            <SettingsItem
              icon="repeat"
              title={t.testFetchFirebase}
              subtitle={t.testFetchFirebaseSubtitle}
              onPress={() => router.push("/test-firebase")}
            />
            <SettingsItem
              icon="qr-code"
              title={t.qrCodeManagement}
              subtitle={t.qrCodeManagementSubtitle}
              onPress={() => router.push("/settings/qr-management")}
            />
            <SettingsItem
              icon="card"
              title={t.paymentSettings}
              subtitle={t.paymentSettingsSubtitle}
              onPress={() => router.push("/settings/payment")}
            />
          </View>
        </View>

        {/* Support Section */}
        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t.support}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="help-circle"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="#9333ea"
              title={t.helpFaq}
              subtitle={t.helpFaqSubtitle}
              onPress={() => Alert.alert("Help", "Navigate to help center")}
            />
            <SettingsItem
              icon="chatbubble-ellipses"
              iconBgColor="bg-teal-100 dark:bg-teal-900/30"
              iconColor="#14b8a6"
              title={t.contactSupport}
              subtitle={t.contactSupportSubtitle}
              onPress={() => Alert.alert("Support", "Contact support")}
            />
          </View>
        </View>

        {/* Account Section */}
        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t.account}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="log-out"
              title={t.signOut}
              showArrow={false}
              danger
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* App Version */}
        <View className="mt-8 items-center">
          <Text
            className="text-slate-400 dark:text-slate-500"
            style={{ fontSize: versionFontSize }}
          >
            {t.version}
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
