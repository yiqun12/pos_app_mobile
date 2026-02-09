import { SettingsItem } from "@/components/profile";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [terminals, setTerminals] = useState([
    { id: "tm_1", name: "Counter iPad", status: "online" },
    { id: "tm_2", name: "Mobile Reader 1", status: "offline" },
  ]);

  // Preferences
  const [allowTipping, setAllowTipping] = useState(true);
  const [printReceipts, setPrintReceipts] = useState(false);
  const [splitPayments, setSplitPayments] = useState(true);

  const handleConnectStripe = () => {
    setConnecting(true);
    // Simulate API call
    setTimeout(() => {
      setIsStripeConnected(true);
      setConnecting(false);
      Alert.alert("Success", "Stripe account connected successfully");
    }, 2000);
  };

  const handleDisconnectStripe = () => {
    Alert.alert(
      "Disconnect Stripe",
      "Are you sure? You will not be able to process payments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            setIsStripeConnected(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title="Payment Settings" showBackButton />

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
                  Stripe
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {isStripeConnected ? "Connected" : "Not connected"}
                </Text>
              </View>
            </View>
            {isStripeConnected && (
              <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="text-xs font-semibold text-green-700 dark:text-green-300">
                  Active
                </Text>
              </View>
            )}
          </View>

          <View className="mt-5">
            {isStripeConnected ? (
              <Button
                label="Disconnect Account"
                variant="outline"
                onPress={handleDisconnectStripe}
                className="border-red-200"
              />
            ) : (
              <Button
                label={connecting ? "Connecting..." : "Connect with Stripe"}
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
                Terminals
              </Text>
              <View className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
                          {terminal.name}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          ID: {terminal.id}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`h-2.5 w-2.5 rounded-full ${
                          terminal.status === "online"
                            ? "bg-green-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <Text className="text-sm text-slate-500 dark:text-slate-400">
                        {terminal.status === "online" ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity className="border-t border-slate-100 bg-slate-50 p-3 items-center dark:border-slate-800 dark:bg-slate-800/50">
                  <Text className="font-semibold text-blue-600 dark:text-blue-400">
                    + Add New Terminal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Preferences */}
            <View className="mx-4 mt-6">
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Preferences
              </Text>
              <View className="gap-3">
                <SettingsItem
                  icon="cash"
                  title="Allow Tipping"
                  subtitle="Enable tip options at checkout"
                  isSwitch
                  switchValue={allowTipping}
                  onSwitchChange={setAllowTipping}
                  showArrow={false}
                />
                <SettingsItem
                  icon="receipt"
                  title="Auto-Print Receipts"
                  subtitle="Print receipt after successful payment"
                  isSwitch
                  switchValue={printReceipts}
                  onSwitchChange={setPrintReceipts}
                  showArrow={false}
                />
                <SettingsItem
                  icon="people"
                  title="Split Payments"
                  subtitle="Allow splitting bill among guests"
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
