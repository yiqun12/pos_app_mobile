import { SettingsItem } from "@/components/profile";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStore } from "@/hooks/firestore/useStore";
import { db, functions } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export default function PaymentSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();

  const isStripeConnected = Boolean(store?.stripeStoreAcct);
  const [connecting, setConnecting] = useState(false);
  const [terminals, setTerminals] = useState<any[]>([]);

  // Preferences
  const [allowTipping, setAllowTipping] = useState(true);
  const [printReceipts, setPrintReceipts] = useState(false);
  const [splitPayments, setSplitPayments] = useState(true);

  useEffect(() => {
    if (!user || !currentStoreId) {
      setTerminals([]);
      return;
    }

    const terminalsRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "terminals");
    const unsubscribe = onSnapshot(terminalsRef, (snapshot) => {
      const nextTerminals = snapshot.docs
        .map((terminal) => ({ id: terminal.id, ...terminal.data() }))
        .sort((a: any, b: any) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
      setTerminals(nextTerminals);
    }, (error) => {
      console.error("Error loading terminals:", error);
    });

    return () => unsubscribe();
  }, [user, currentStoreId]);

  const handleConnectStripe = () => {
    if (!user || !currentStoreId) return;
    setConnecting(true);
    const createStripeLink = httpsCallable(functions, "createStripeLink");
    createStripeLink({ store: currentStoreId, userID: user.uid })
      .then(async (result: any) => {
        const url = result.data?.url;
        if (!url) throw new Error("createStripeLink did not return a URL");
        await WebBrowser.openBrowserAsync(url);
      })
      .catch((error) => {
        console.error("Error creating Stripe link:", error);
        Alert.alert(t("common.error"), t("settings.payment.stripeLinkFailed"));
      })
      .finally(() => {
        setConnecting(false);
      });
  };

  const handleDisconnectStripe = () => {
    Alert.alert(
      t("settings.payment.disconnectTitle"),
      t("settings.payment.disconnectMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.payment.disconnectButton"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("settings.payment.disconnectTitle"),
              t("settings.payment.disconnectMessage")
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={t("settings.payment.title")} showBackButton />

      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        {/* Stripe Connection Status */}
        <View className="m-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl ${
                  isStripeConnected
                    ? "bg-indigo-100 dark:bg-indigo-900/30"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Ionicons
                  name="card"
                  size={24}
                  color={isStripeConnected ? "#6366f1" : colors.text}
                />
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("settings.payment.providerName")}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {isStripeConnected
                    ? t("settings.payment.connected")
                    : t("settings.payment.notConnected")}
                </Text>
              </View>
            </View>
            {isStripeConnected && (
              <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {t("settings.payment.active")}
                </Text>
              </View>
            )}
          </View>

          <View className="mt-5">
            {isStripeConnected ? (
              <Button
                label={t("settings.payment.disconnectAccount")}
                variant="outline"
                onPress={handleDisconnectStripe}
                className="border-red-200"
              />
            ) : (
              <Button
                label={
                  connecting
                    ? t("settings.payment.connecting")
                    : t("settings.payment.connectWithStripe")
                }
                onPress={handleConnectStripe}
                loading={connecting}
                className="bg-indigo-600"
              />
            )}
          </View>
        </View>

        {isStripeConnected && (
          <>
            {/* Terminals Section */}
            <View className="mx-4 mt-2">
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("settings.payment.terminals")}
              </Text>
              <View className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {terminals.length === 0 && (
                  <View className="p-4">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      No terminals registered for this store.
                    </Text>
                  </View>
                )}
                {terminals.map((terminal, index) => (
                  <View
                    key={terminal.id}
                    className={`flex-row items-center justify-between p-4 ${
                      index !== terminals.length - 1
                        ? "border-b border-slate-100 dark:border-slate-800"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Ionicons
                          name="hardware-chip-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>
                      <View>
                        <Text className="font-semibold text-slate-900 dark:text-white">
                          {terminal.name ?? terminal.label ?? t("settings.payment.stripeTerminalDefault")}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          {t("settings.payment.idPrefix")} {terminal.id}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`h-2.5 w-2.5 rounded-full ${
                          terminal.status === "online" || terminal.status === "active"
                            ? "bg-green-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <Text className="text-sm text-slate-500 dark:text-slate-400">
                        {terminal.status === "online" || terminal.status === "active"
                          ? t("settings.payment.online")
                          : t("settings.payment.offline")}
                      </Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity className="border-t border-slate-100 bg-slate-50 p-3 items-center dark:border-slate-800 dark:bg-slate-800/50">
                  <Text className="font-semibold text-blue-600 dark:text-blue-400">
                    {t("settings.payment.addNewTerminal")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Preferences */}
            <View className="mx-4 mt-6">
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("settings.payment.preferences")}
              </Text>
              <View className="gap-3">
                <SettingsItem
                  icon="cash"
                  title={t("settings.payment.allowTipping")}
                  subtitle={t("settings.payment.allowTippingSubtitle")}
                  isSwitch
                  switchValue={allowTipping}
                  onSwitchChange={setAllowTipping}
                  showArrow={false}
                />
                <SettingsItem
                  icon="receipt"
                  title={t("settings.payment.autoPrintReceipts")}
                  subtitle={t("settings.payment.autoPrintReceiptsSubtitle")}
                  isSwitch
                  switchValue={printReceipts}
                  onSwitchChange={setPrintReceipts}
                  showArrow={false}
                />
                <SettingsItem
                  icon="people"
                  title={t("settings.payment.splitPayments")}
                  subtitle={t("settings.payment.splitPaymentsSubtitle")}
                  isSwitch
                  switchValue={splitPayments}
                  onSwitchChange={setSplitPayments}
                  showArrow={false}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
