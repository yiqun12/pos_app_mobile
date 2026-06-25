import { Button } from "@/components/ui/Button";
import { useMenu } from "@/context/menu";
import { functions } from "@/lib/firebase";
import {
  buildGenerateJsonPayload,
  extractMenuTextFromImageBase64,
} from "@/lib/pos/menuAiScan";
import type { WebMenuItem } from "@/lib/pos/menuTransforms";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { httpsCallable } from "firebase/functions";
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

const SAMPLE_MENU_IMAGE = require("@/assets/images/sample-menu.png");

type PickedImage = {
  uri: string;
  base64?: string;
  source?: "sample" | "upload" | "camera";
};

type GenerateJsonResponse = {
  result?: WebMenuItem[];
};

type MenuAIScannerTabProps = {
  onSaved?: () => void;
};

export function MenuAIScannerTab({ onSaved }: MenuAIScannerTabProps) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [scannedItems, setScannedItems] = useState<WebMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { mergeScannedRawItems, saving } = useMenu();
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
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled) {
        setImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64 ?? undefined,
          source: "camera",
        });
        setScannedItems([]);
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
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled) {
      setImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 ?? undefined,
        source: "upload",
      });
      setScannedItems([]);
    }
  };

  const useSampleMenu = async () => {
    setLoading(true);
    try {
      const asset = Asset.fromModule(SAMPLE_MENU_IMAGE);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImage({
        uri,
        base64,
        source: "sample",
      });
      setScannedItems([]);
    } catch (error) {
      console.error("Loading sample menu failed:", error);
      Alert.alert(t("common.error"), "Unable to load sample menu image.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    if (!image.base64) {
      Alert.alert(t("common.error"), "Unable to read image data.");
      return;
    }

    setLoading(true);
    try {
      const generateJSON = httpsCallable<{
        url: string;
        ocr_scan: string;
        LanMode: string;
        imgBool: string;
      }, GenerateJsonResponse>(functions, "generateJSON");
      const ocrScan = await extractMenuTextFromImageBase64(image.base64);
      const response = await generateJSON(
        buildGenerateJsonPayload({
          base64Image: image.base64,
          ocrScan,
        })
      );
      const rawItems = Array.isArray(response.data?.result)
        ? response.data.result
        : [];
      setScannedItems(rawItems);
      Alert.alert(
        t("common.success"),
        rawItems.length > 0
          ? `Scanned ${rawItems.length} menu items.`
          : "No menu items were returned."
      );
    } catch (error) {
      console.error("Menu scan failed:", error);
      Alert.alert(t("common.error"), t("menu.scanner.analyzeFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (scannedItems.length === 0) return;
    setLoading(true);
    try {
      await mergeScannedRawItems(scannedItems);
      Alert.alert(t("common.success"), `Saved ${scannedItems.length} menu items.`);
      setScannedItems([]);
      setImage(null);
      onSaved?.();
    } catch (error) {
      console.error("Saving scanned menu failed:", error);
      Alert.alert(t("common.error"), "Unable to save scanned menu items.");
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

      {!image && (
        <View className="mb-6">
          <Text className="mb-2 text-center font-semibold text-slate-700 dark:text-slate-200">
            Sample Menu
          </Text>
          <TouchableOpacity
            onPress={useSampleMenu}
            disabled={loading}
            className="items-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-2 active:border-orange-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <Image
              source={SAMPLE_MENU_IMAGE}
              style={{ width: "100%", height: 240 }}
              contentFit="contain"
            />
            <Text className="mt-2 text-sm text-slate-500">
              Click to use this sample
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="mb-8 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        {image ? (
          <View className="relative">
            <Image
              source={{ uri: image.uri }}
              style={{ width: "100%", height: 300 }}
              contentFit="contain"
            />
            <TouchableOpacity
              onPress={() => {
                setImage(null);
                setScannedItems([]);
              }}
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
        disabled={!image || loading || saving}
        className="w-full"
      />

      {scannedItems.length > 0 && (
        <View className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-3 font-semibold text-slate-900 dark:text-white">
            Scan Preview ({scannedItems.length})
          </Text>
          {scannedItems.slice(0, 20).map((item, index) => (
            <View
              key={`${item.id ?? item.name ?? "item"}-${index}`}
              className="mb-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-800"
            >
              <Text className="font-semibold text-slate-900 dark:text-white">
                {item.name ?? "Untitled"}
                {item.CHI ? ` / ${item.CHI}` : ""}
              </Text>
              <Text className="text-sm text-slate-500">
                {item.category ?? "Scanned Items"} · $
                {Number(item.subtotal ?? item.price ?? 0).toFixed(2)}
              </Text>
            </View>
          ))}
          <Button
            label={saving ? "Saving..." : `Save ${scannedItems.length} Items`}
            onPress={handleConfirmSave}
            disabled={loading || saving}
            loading={saving}
            className="mt-2 w-full"
          />
        </View>
      )}

      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-sm text-slate-500">
            {t("menu.scanner.analyzingStructure")}
          </Text>
        </View>
      )}

      {!loading && !image && scannedItems.length === 0 && (
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
