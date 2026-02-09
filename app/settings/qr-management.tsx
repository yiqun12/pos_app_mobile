import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

// Initial restaurant ID - reusing the same test ID
const RESTAURANT_DOC_ID = "23-sf-90011-960";

export default function QRManagementScreen() {
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuUrl, setMenuUrl] = useState("");

  useEffect(() => {
    fetchStoreQRData();
  }, []);

  const fetchStoreQRData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "TitleLogoNameContent", RESTAURANT_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setMenuUrl(
          data.MenuUrl || `https://eatify.app/menu/${RESTAURANT_DOC_ID}`
        );
      }
    } catch (error) {
      console.error("Error fetching QR data:", error);
      Alert.alert("Error", "Failed to load store QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, "TitleLogoNameContent", RESTAURANT_DOC_ID);
      await updateDoc(docRef, { MenuUrl: menuUrl });
      Alert.alert("Success", "Store QR Code URL updated");
    } catch (error) {
      console.error("Error updating QR data:", error);
      Alert.alert("Error", "Failed to update URL");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-white dark:bg-slate-950"
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title="QR Management" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          contentContainerClassName="pb-10"
        >
          {/* QR Code Display */}
          <View className="items-center justify-center py-8">
            <View className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-white dark:border-none">
              {/* Always render QR on white background for contrast */}
              {menuUrl ? (
                <QRCode
                  value={menuUrl}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <View className="h-[200px] w-[200px] items-center justify-center bg-slate-100">
                  <Ionicons name="qr-code-outline" size={64} color="#94a3b8" />
                </View>
              )}
            </View>
            <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Scan to view menu
            </Text>
          </View>

          {/* Configuration */}
          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Menu URL / QR Payload
              </Text>
              <Input
                value={menuUrl}
                onChangeText={setMenuUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text className="mt-1 text-xs text-slate-400">
                This URL is encoded into the stores QR code.
              </Text>
            </View>

            <View className="mt-4">
              <Button
                label={saving ? "Saving..." : "Save QR Code"}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
