import { SettingsItem, Store, StoreSelector } from "@/components/profile";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/context/language";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

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
  const { t } = useTranslation();

  const [currentStore, setCurrentStore] = useState<Store>(MOCK_STORES[0]);
  const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("profile.signOutTitle"), t("profile.signOutMessage"), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: () => {
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const handleStoreSelect = (store: Store) => {
    setCurrentStore(store);
    setStoreSelectorVisible(false);
  };

  const handleCreateStore = () => {
    setStoreSelectorVisible(false);
    router.push("/settings/store");
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("profile.profile")}
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
        <View className="mt-4 rounded-2xl bg-orange-500 p-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="person" size={32} color="white" />
            </View>
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
            <TouchableOpacity
              onPress={() => router.push("/settings/edit-profile")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

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
                {t("profile.currentStore")}
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
                {t("profile.switch")}
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color="#f97316" />
            </View>
          </View>
        </TouchableOpacity>

        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t("profile.settings")}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="lock-closed"
              title={t("profile.changePassword")}
              subtitle={t("profile.updatePassword")}
              onPress={() => router.push("/settings/change-password")}
            />

            <SettingsItem
              icon="globe"
              title={t("profile.language")}
              subtitle={t("profile.languageSubtitle")}
              isSwitch
              switchValue={language === "zh"}
              onSwitchChange={(value) => setLanguage(value ? "zh" : "en")}
              showArrow={false}
            />
            <SettingsItem
              icon="settings"
              title={t("profile.storeSettings")}
              subtitle={t("profile.storeSettingsSubtitle")}
              onPress={() => router.push("/settings/store")}
            />
            <SettingsItem
              icon="repeat"
              title={t("profile.testFetchFirebase")}
              subtitle={t("profile.testFetchFirebaseSubtitle")}
              onPress={() => router.push("/test-firebase")}
            />
            <SettingsItem
              icon="qr-code"
              title={t("profile.qrCodeManagement")}
              subtitle={t("profile.qrCodeManagementSubtitle")}
              onPress={() => router.push("/settings/qr-management")}
            />
            <SettingsItem
              icon="card"
              title={t("profile.paymentSettings")}
              subtitle={t("profile.paymentSettingsSubtitle")}
              onPress={() => router.push("/settings/payment")}
            />
          </View>
        </View>

        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t("profile.support")}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="help-circle"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="#9333ea"
              title={t("profile.helpFaq")}
              subtitle={t("profile.helpFaqSubtitle")}
              onPress={() =>
                Alert.alert(t("profile.helpAlertTitle"), t("profile.helpAlertMessage"))
              }
            />
            <SettingsItem
              icon="chatbubble-ellipses"
              iconBgColor="bg-teal-100 dark:bg-teal-900/30"
              iconColor="#14b8a6"
              title={t("profile.contactSupport")}
              subtitle={t("profile.contactSupportSubtitle")}
              onPress={() =>
                Alert.alert(
                  t("profile.supportAlertTitle"),
                  t("profile.supportAlertMessage")
                )
              }
            />
          </View>
        </View>

        <View className="mt-6">
          <Text
            className="mb-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            style={{ fontSize: sectionTitleFontSize }}
          >
            {t("profile.account")}
          </Text>
          <View className="gap-3">
            <SettingsItem
              icon="log-out"
              title={t("profile.signOut")}
              showArrow={false}
              danger
              onPress={handleLogout}
            />
          </View>
        </View>

        <View className="mt-8 items-center">
          <Text
            className="text-slate-400 dark:text-slate-500"
            style={{ fontSize: versionFontSize }}
          >
            {t("profile.version")}
          </Text>
        </View>
      </ScrollView>

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
