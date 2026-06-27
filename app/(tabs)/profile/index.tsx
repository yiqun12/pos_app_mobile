import { PaymentHistoryModal, SettingsItem, Store, StoreSelector } from "@/components/profile";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import { useStoreSelection } from "@/context/store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

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
  const userIdFontSize = isTablet ? 14 : 12;
  const purchaseHistoryFontSize = isTablet ? 16 : 14;
  const sectionTitleFontSize = isTablet ? 16 : 14;
  const versionFontSize = isTablet ? 15 : 14;
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, logout, deleteAccount } = useAuth();
  const { storeList, currentStoreId, setCurrentStoreId } = useStoreSelection();

  const currentStore = storeList.find((s) => s.id === currentStoreId) ?? null;
  const storesForSelector: Store[] = storeList.map((s) => ({
    id: s.id,
    name: s.name,
    nameCHI: s.nameCN,
    address: "",
  }));

  const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);
  const [purchaseHistoryVisible, setPurchaseHistoryVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("profile.signOutTitle"), t("profile.signOutMessage"), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // Route guard will redirect to (auth)
          } catch (err) {
            console.error("Logout failed:", err);
          }
        },
      },
    ]);
  };

  const handleStoreSelect = async (store: Store) => {
    await setCurrentStoreId(store.id);
    setStoreSelectorVisible(false);
  };

  const handleCreateStore = () => {
    setStoreSelectorVisible(false);
    router.push("/settings/create-store");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert(t("common.error"), t("profile.deleteAccountPasswordRequired"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      setDeletePassword("");
      setDeleteAccountVisible(false);
      Alert.alert(t("common.success"), t("profile.deleteAccountSuccess"));
    } catch (err: any) {
      const code = err?.code as string | undefined;
      let message = err?.message ?? t("profile.deleteAccountFailed");
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        message = t("profile.deleteAccountWrongPassword");
      } else if (code === "auth/requires-recent-login") {
        message = t("profile.deleteAccountRecentLoginRequired");
      } else if (code === "auth/network-request-failed") {
        message = t("auth.networkError");
      }
      Alert.alert(t("common.error"), message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || t("profile.defaultUserName");

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
                {displayName}
              </Text>
              <Text
                className="mt-1 text-orange-100"
                style={{ fontSize: userEmailFontSize }}
              >
                {user?.email ?? "—"}
              </Text>
              {user?.uid ? (
                <Text
                  className="mt-1 text-orange-100/90"
                  style={{ fontSize: userIdFontSize }}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {t("profile.userIdLabel")}: {user.uid}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings/edit-profile")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setPurchaseHistoryVisible(true)}
            activeOpacity={0.8}
            className="mt-4 flex-row items-center justify-between rounded-xl bg-white/15 px-3.5 py-3"
          >
            <View className="mr-3 flex-1 flex-row items-center">
              <Ionicons name="receipt-outline" size={18} color="#fff" />
              <Text
                className="ml-2 font-semibold text-white"
                style={{ fontSize: purchaseHistoryFontSize }}
              >
                {t("profile.purchaseHistory")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
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
                {currentStore?.name ?? t("profile.noStoreSelected")}
              </Text>
              {currentStore?.nameCN && (
                <Text
                  className="text-slate-500 dark:text-slate-400"
                  style={{ fontSize: storeNameChiFontSize }}
                >
                  {currentStore.nameCN}
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
            <SettingsItem
              icon="trash"
              title={t("profile.deleteAccount")}
              subtitle={t("profile.deleteAccountSubtitle")}
              showArrow={false}
              danger
              onPress={() => setDeleteAccountVisible(true)}
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
        stores={storesForSelector}
        currentStoreId={currentStoreId ?? ""}
        onSelect={handleStoreSelect}
        onClose={() => setStoreSelectorVisible(false)}
        onCreateStore={handleCreateStore}
      />

      <PaymentHistoryModal
        visible={purchaseHistoryVisible}
        storeList={storeList}
        onClose={() => setPurchaseHistoryVisible(false)}
      />

      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingAccount) setDeleteAccountVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isDeletingAccount) setDeleteAccountVisible(false);
          }}
        >
          <View className="flex-1 items-center justify-center bg-black/50 px-5">
            <TouchableWithoutFeedback>
              <View className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900">
                <View className="mb-4 flex-row items-center">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Ionicons name="trash" size={22} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("profile.deleteAccount")}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t("profile.deleteAccountModalSubtitle")}
                    </Text>
                  </View>
                </View>

                <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t("profile.currentPassword")}
                </Text>
                <TextInput
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  editable={!isDeletingAccount}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <Text className="mt-3 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {t("profile.deleteAccountWarning")}
                </Text>

                <View className="mt-5 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      if (!isDeletingAccount) {
                        setDeleteAccountVisible(false);
                        setDeletePassword("");
                      }
                    }}
                    disabled={isDeletingAccount}
                    className="min-h-11 flex-1 items-center justify-center rounded-xl border border-orange-500"
                  >
                    <Text className="font-semibold text-orange-600">
                      {t("common.cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    disabled={isDeletingAccount || !deletePassword.trim()}
                    className={`min-h-11 flex-1 items-center justify-center rounded-xl ${
                      isDeletingAccount || !deletePassword.trim()
                        ? "bg-red-300"
                        : "bg-red-500"
                    }`}
                  >
                    <Text className="font-semibold text-white">
                      {isDeletingAccount
                        ? t("profile.deletingAccount")
                        : t("profile.deleteAccountConfirm")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
