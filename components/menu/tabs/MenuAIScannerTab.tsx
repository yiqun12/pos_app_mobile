import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

async function scanMenuWithAI(imageUri: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("Analyzing menu image:", imageUri);
}

export function MenuAIScannerTab() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handlePickImage = () => {
    Alert.alert(t("menu.scanner.scanMenu"), t("menu.scanner.chooseOption"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("menu.scanner.takePhoto"), onPress: takePhoto },
      { text: t("menu.scanner.chooseFromGallery"), onPress: pickImage },
    ]);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t("menu.scanner.cameraPermissionRequired"));
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (_error) {
      Alert.alert(
        t("menu.scanner.cameraUnavailableTitle"),
        t("menu.scanner.cameraUnavailableMessage")
      );
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleScan = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      await scanMenuWithAI(imageUri);
      Alert.alert(t("common.success"), t("menu.scanner.analyzeSuccess"));
      setImageUri(null);
    } catch (_error) {
      Alert.alert(t("common.error"), t("menu.scanner.analyzeFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4 dark:bg-slate-950">
      <View className="mb-6 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Ionicons name="scan-outline" size={40} color="#2563eb" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("menu.aiScannerTitle")}
        </Text>
        <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
          {t("menu.scanner.subtitle")}
        </Text>
      </View>

      <View className="mb-8 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        {imageUri ? (
          <View className="relative">
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: 300 }}
              contentFit="contain"
            />
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePickImage} className="items-center py-16">
            <Ionicons name="camera" size={48} color="#94a3b8" />
            <Text className="mt-4 font-medium text-slate-500">
              {t("menu.scanner.tapToTakePhoto")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        label={loading ? t("menu.scanner.analyzing") : t("menu.scanner.processMenu")}
        onPress={handleScan}
        disabled={!imageUri || loading}
        className="w-full"
      />

      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-sm text-slate-500">
            {t("menu.scanner.analyzingStructure")}
          </Text>
        </View>
      )}

      {!loading && !imageUri && (
        <View className="mt-8">
          <Text className="mb-4 font-semibold text-slate-900 dark:text-white">
            {t("menu.scanner.howItWorks")}
          </Text>
          <View className="mb-4 flex-row items-start space-x-3">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">1</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                {t("menu.scanner.step1Title")}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                {t("menu.scanner.step1Desc")}
              </Text>
            </View>
          </View>
          <View className="mb-4 flex-row items-start space-x-3">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">2</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                {t("menu.scanner.step2Title")}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                {t("menu.scanner.step2Desc")}
              </Text>
            </View>
          </View>
          <View className="flex-row items-start space-x-3">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">3</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                {t("menu.scanner.step3Title")}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                {t("menu.scanner.step3Desc")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
