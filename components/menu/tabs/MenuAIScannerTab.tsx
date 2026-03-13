import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Mock AI scanner function
 * In production, this would call an AI service to analyze menu images
 */
async function scanMenuWithAI(imageUri: string): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // Mock implementation - in production, send to AI service
  console.log("Analyzing menu image:", imageUri);
  
  // TODO: Implement actual AI menu analysis
  // This would typically:
  // 1. Send image to AI vision API (Google Vision, Claude Vision, etc.)
  // 2. Parse response for menu items, prices, descriptions
  // 3. Add items to database
}

export function MenuAIScannerTab() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = () => {
    Alert.alert("Scan Menu", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
    ]);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
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
    } catch (error) {
      Alert.alert(
        "Camera Unavailable",
        "Camera is not available on this device/simulator. Please choose from gallery."
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
      Alert.alert(
        "Success",
        "Menu analyzed! Items would be added to your menu in production."
      );
      setImageUri(null);
    } catch (error) {
      Alert.alert("Error", "Failed to analyze menu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4 dark:bg-slate-950">
      <View className="mb-6 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded- full bg-blue-100 dark:bg-blue-900/30">
          <Ionicons name="scan-outline" size={40} color="#2563eb" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          AI Menu Scanner
        </Text>
        <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
          Take a photo of your paper menu and let AI extract items, prices, and
          descriptions automatically.
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
          <TouchableOpacity
            onPress={handlePickImage}
            className="items-center py-16"
          >
            <Ionicons name="camera" size={48} color="#94a3b8" />
            <Text className="mt-4 font-medium text-slate-500">
              Tap to Take Photo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        label={loading ? "Analyzing..." : "Process Menu"}
        onPress={handleScan}
        disabled={!imageUri || loading}
        className="w-full"
      />

      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-sm text-slate-500">
            Analyzing menu structure...
          </Text>
        </View>
      )}

      {!loading && !imageUri && (
        <View className="mt-8">
          <Text className="mb-4 font-semibold text-slate-900 dark:text-white">
            How it works
          </Text>
          <View className="flex-row items-start space-x-3 mb-4">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">
                1
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                Upload or Capture
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                Take a clear photo of your menu page.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start space-x-3 mb-4">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">
                2
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                AI Analysis
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                Our AI identifies specific dishes, prices, and categories.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start space-x-3">
            <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Text className="font-bold text-blue-600 dark:text-blue-400">
                3
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">
                Review & Publish
              </Text>
              <Text className="text-slate-500 dark:text-slate-400">
                Check the items and add them to your digital menu.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
