import { useLicense } from "@/context/license";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export function ActivationModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { showActivationModal, setShowActivationModal, activateLicense, isActivating } =
    useLicense();
  const [licenseKey, setLicenseKey] = useState("");

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      Alert.alert("Error", "Please enter a license key");
      return;
    }

    const success = await activateLicense(licenseKey);
    if (success) {
      Alert.alert("Success", "License activated successfully!");
      setLicenseKey("");
    } else {
      Alert.alert(
        "Invalid Key",
        "The license key you entered is invalid. Please try again."
      );
    }
  };

  const handleClose = () => {
    if (!isActivating) {
      setShowActivationModal(false);
      setLicenseKey("");
    }
  };

  return (
    <Modal
      visible={showActivationModal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback>
              <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
                {/* Header */}
                <View className="mb-4 items-center">
                  <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                    <Ionicons name="key" size={32} color="#f59e0b" />
                  </View>
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">
                    Activate License
                  </Text>
                  <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                    Enter your license key to unlock the full version of 7Dollar POS.
                  </Text>
                </View>

                {/* Demo Mode Badge */}
                <View className="mb-4 flex-row items-center justify-center rounded-lg bg-amber-50 py-2 dark:bg-amber-900/20">
                  <Ionicons name="information-circle" size={16} color="#d97706" />
                  <Text className="ml-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Demo Mode Active - Limited Features
                  </Text>
                </View>

                {/* License Key Input */}
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    License Key
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800">
                    <Ionicons name="key-outline" size={18} color={colors.tabIconDefault} />
                    <TextInput
                      className="ml-3 flex-1 py-3.5 text-base text-slate-900 dark:text-white"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      placeholderTextColor={colors.tabIconDefault}
                      value={licenseKey}
                      onChangeText={setLicenseKey}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!isActivating}
                    />
                  </View>
                </View>

                {/* Buttons */}
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={handleActivate}
                    disabled={isActivating}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-center rounded-xl py-3.5 ${
                      isActivating ? "bg-blue-400" : "bg-blue-600"
                    }`}
                  >
                    {isActivating ? (
                      <Text className="font-semibold text-white">Activating...</Text>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text className="ml-2 font-semibold text-white">
                          Activate License
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isActivating}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-center rounded-xl bg-slate-100 py-3.5 dark:bg-slate-800"
                  >
                    <Text className="font-semibold text-slate-600 dark:text-slate-400">
                      Continue in Demo Mode
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Help Link */}
                <TouchableOpacity className="mt-4 items-center">
                  <Text className="text-sm text-blue-600 dark:text-blue-400">
                    Where do I find my license key?
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

