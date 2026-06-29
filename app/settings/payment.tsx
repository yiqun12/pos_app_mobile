import { SettingsItem } from "@/components/profile";
import { RegisterTerminalModal } from "@/components/settings/RegisterTerminalModal";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStore } from "@/hooks/firestore/useStore";
import { db, functions } from "@/lib/firebase";
import {
  buildTableScanPayUrl,
  formatTerminalAddedDate,
  processTerminalTestPayment,
  resetTerminalReader,
  type TerminalDoc,
} from "@/lib/pos/terminalCore";
import {
  getSelectedTerminalId,
  setSelectedTerminalId,
} from "@/lib/pos/terminalStorage";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export default function PaymentSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();

  const isStripeConnected = Boolean(store?.stripeStoreAcct);
  const [connecting, setConnecting] = useState(false);
  const [terminals, setTerminals] = useState<TerminalDoc[]>([]);
  const [kioskTerminals, setKioskTerminals] = useState<TerminalDoc[]>([]);
  const [selectedTerminalId, setSelectedTerminalIdState] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [registerVisible, setRegisterVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [resettingTerminal, setResettingTerminal] = useState(false);

  const [allowTipping, setAllowTipping] = useState(true);
  const [printReceipts, setPrintReceipts] = useState(false);
  const [splitPayments, setSplitPayments] = useState(true);

  const tableNames = useMemo(
    () => (store?.seatLayout.tables ?? []).map((seat) => seat.name).filter(Boolean),
    [store?.seatLayout.tables]
  );

  const selectedTerminal = useMemo(
    () => terminals.find((terminal) => terminal.id === selectedTerminalId) ?? null,
    [selectedTerminalId, terminals]
  );

  const dateLanguage = i18n.language.startsWith("zh") ? "zh" : "en";

  useEffect(() => {
    if (!user || !currentStoreId) {
      setTerminals([]);
      setKioskTerminals([]);
      return;
    }

    const terminalsRef = collection(
      db,
      "stripe_customers",
      user.uid,
      "TitleLogoNameContent",
      currentStoreId,
      "terminals"
    );
    const kioskRef = collection(
      db,
      "stripe_customers",
      user.uid,
      "TitleLogoNameContent",
      currentStoreId,
      "kiosk"
    );

    const unsubscribeTerminals = onSnapshot(
      terminalsRef,
      (snapshot) => {
        const nextTerminals = snapshot.docs
          .map((terminal) => ({ id: terminal.id, ...(terminal.data() as object) }))
          .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
        setTerminals(nextTerminals);
      },
      (error) => {
        console.error("Error loading terminals:", error);
      }
    );

    const unsubscribeKiosk = onSnapshot(
      kioskRef,
      (snapshot) => {
        const nextKiosk = snapshot.docs
          .map((terminal) => ({ id: terminal.id, ...(terminal.data() as object) }))
          .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
        setKioskTerminals(nextKiosk);
      },
      (error) => {
        console.error("Error loading kiosk terminals:", error);
      }
    );

    return () => {
      unsubscribeTerminals();
      unsubscribeKiosk();
    };
  }, [user, currentStoreId]);

  useEffect(() => {
    if (!currentStoreId || terminals.length === 0) {
      setSelectedTerminalIdState("");
      return;
    }

    let cancelled = false;
    (async () => {
      const storedId = await getSelectedTerminalId(currentStoreId);
      const fallbackId = terminals[0]?.id ?? "";
      const nextId =
        storedId && terminals.some((terminal) => terminal.id === storedId)
          ? storedId
          : fallbackId;
      if (!cancelled) setSelectedTerminalIdState(nextId);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStoreId, terminals]);

  useEffect(() => {
    if (tableNames.length === 0) {
      setSelectedTable("");
      return;
    }
    setSelectedTable((current) =>
      current && tableNames.includes(current) ? current : tableNames[0]
    );
  }, [tableNames]);

  const handleSelectTerminal = useCallback(
    async (terminalId: string) => {
      setSelectedTerminalIdState(terminalId);
      if (currentStoreId) {
        await setSelectedTerminalId(currentStoreId, terminalId);
      }
    },
    [currentStoreId]
  );

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
      [{ text: t("common.ok") }]
    );
  };

  const handleProcessPayment = async () => {
    if (!user || !currentStoreId || !store?.stripeStoreAcct || !selectedTerminal) return;
    if (!selectedTable) {
      Alert.alert(t("common.error"), t("settings.payment.selectTableRequired"));
      return;
    }

    setProcessingPayment(true);
    try {
      await processTerminalTestPayment({
        uid: user.uid,
        storeId: currentStoreId,
        stripeAccountId: store.stripeStoreAcct,
        terminal: selectedTerminal,
        tableName: selectedTable,
        userEmail: user.email,
        amountCents: 100,
      });
      Alert.alert(t("common.success"), t("settings.payment.processPaymentSent"));
    } catch (err) {
      console.error("Failed to process terminal payment:", err);
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("settings.payment.processPaymentFailed")
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleResetTerminal = async () => {
    if (!user || !currentStoreId || !store?.stripeStoreAcct || !selectedTerminal) return;

    setResettingTerminal(true);
    try {
      await resetTerminalReader({
        uid: user.uid,
        storeId: currentStoreId,
        stripeAccountId: store.stripeStoreAcct,
        terminal: selectedTerminal,
      });
      Alert.alert(t("common.success"), t("settings.payment.resetPosSuccess"));
    } catch (err) {
      console.error("Failed to reset terminal:", err);
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("settings.payment.resetPosFailed")
      );
    } finally {
      setResettingTerminal(false);
    }
  };

  const handleOpenRegister = () => {
    if (!isStripeConnected) {
      Alert.alert(t("common.error"), t("settings.payment.connectStripeFirst"));
      return;
    }
    setRegisterVisible(true);
  };

  const scanPayUrl =
    currentStoreId && selectedTable
      ? buildTableScanPayUrl(currentStoreId, selectedTable)
      : "";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader
        title={t("settings.payment.title")}
        showBackButton
        rightElement={
          <TouchableOpacity
            onPress={handleOpenRegister}
            className="h-10 flex-row items-center gap-1 rounded-full bg-orange-50 px-3 dark:bg-orange-950/40"
            accessibilityRole="button"
            accessibilityLabel={t("settings.payment.addNewTerminal")}
          >
            <Ionicons name="add" size={18} color="#f97316" />
            <Text className="text-sm font-semibold text-orange-600 dark:text-orange-300">
              {t("settings.payment.addNewTerminal")}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" contentContainerClassName="pb-10">
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
            {isStripeConnected ? (
              <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {t("settings.payment.active")}
                </Text>
              </View>
            ) : null}
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

        {!isStripeConnected ? (
          <View className="mx-4 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <Text className="text-sm text-amber-800 dark:text-amber-200">
              {t("settings.payment.connectStripeFirst")}
            </Text>
          </View>
        ) : null}

        <View className="mx-4 mt-4">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("settings.payment.selectYourPos")}
          </Text>
              <View className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <View className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {t("settings.payment.frontDeskTerminals")}
                  </Text>
                </View>

                {terminals.length === 0 ? (
                  <View className="p-4">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {t("settings.payment.noTerminals")}
                    </Text>
                  </View>
                ) : (
                  terminals.map((terminal, index) => {
                    const selected = selectedTerminalId === terminal.id;
                    const machineNumber = terminals.length - index;
                    return (
                      <TouchableOpacity
                        key={terminal.id}
                        onPress={() => handleSelectTerminal(terminal.id)}
                        className={`flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 ${
                          selected ? "bg-orange-50 dark:bg-orange-950/20" : ""
                        }`}
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                            selected
                              ? "border-orange-500 bg-orange-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selected ? (
                            <View className="h-2 w-2 rounded-full bg-white" />
                          ) : null}
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-slate-900 dark:text-white">
                            {t("settings.payment.posMachineLabel", {
                              number: machineNumber,
                            })}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {t("settings.payment.addedOn", {
                              date: formatTerminalAddedDate(terminal.date, dateLanguage),
                            })}
                          </Text>
                          <Text className="mt-0.5 text-xs text-slate-400">
                            {t("settings.payment.idPrefix")} {terminal.id}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {kioskTerminals.length > 0 ? (
                  <View className="border-t border-slate-100 dark:border-slate-800">
                    <View className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {t("settings.payment.kioskTerminals")}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        {t("settings.payment.kioskTerminalsHint")}
                      </Text>
                    </View>
                    {kioskTerminals.map((terminal, index) => (
                      <View
                        key={`kiosk-${terminal.id}`}
                        className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"
                      >
                        <Text className="font-medium text-blue-600 dark:text-blue-400">
                          {t("settings.payment.posMachineLabel", {
                            number: kioskTerminals.length - index,
                          })}{" "}
                          ({terminal.id})
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {t("settings.payment.addedOn", {
                            date: formatTerminalAddedDate(terminal.date, dateLanguage),
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mx-4 mt-6 gap-3">
              <Button
                label={
                  processingPayment
                    ? t("settings.payment.processingPayment")
                    : t("settings.payment.processPayment")
                }
                onPress={handleProcessPayment}
                loading={processingPayment}
                disabled={
                  !isStripeConnected ||
                  !selectedTerminal ||
                  !selectedTable ||
                  processingPayment ||
                  resettingTerminal
                }
                className="bg-indigo-600"
              />
              <Button
                label={
                  resettingTerminal
                    ? t("settings.payment.resettingPos")
                    : t("settings.payment.resetPos")
                }
                variant="outline"
                onPress={handleResetTerminal}
                loading={resettingTerminal}
                disabled={
                  !isStripeConnected ||
                  !selectedTerminal ||
                  processingPayment ||
                  resettingTerminal
                }
                className="border-red-200"
              />
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {t("settings.payment.testPaymentHint")}
              </Text>
            </View>

            <View className="mx-4 mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Text className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                {t("settings.payment.scanToPayTable")}
              </Text>

              {tableNames.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                  contentContainerClassName="gap-2"
                >
                  {tableNames.map((tableName) => {
                    const active = selectedTable === tableName;
                    return (
                      <TouchableOpacity
                        key={tableName}
                        onPress={() => setSelectedTable(tableName)}
                        className={`rounded-full px-4 py-2 ${
                          active
                            ? "bg-orange-500"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            active ? "text-white" : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {tableName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text className="mb-4 text-sm text-slate-500">
                  {t("settings.payment.noTablesForQr")}
                </Text>
              )}

              {scanPayUrl ? (
                <View className="items-center">
                  <View className="rounded-xl bg-white p-4">
                    <QRCode value={scanPayUrl} size={160} />
                  </View>
                  <Text className="mt-3 text-center text-xs text-slate-500">
                    {scanPayUrl}
                  </Text>
                </View>
              ) : null}
            </View>

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
      </ScrollView>

      {store && user ? (
        <RegisterTerminalModal
          visible={registerVisible}
          uid={user.uid}
          store={store}
          onClose={() => setRegisterVisible(false)}
          onRegistered={() => setRegisterVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
