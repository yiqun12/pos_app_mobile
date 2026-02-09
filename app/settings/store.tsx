import { WorkingHoursEditor } from "@/components/profile/WorkingHoursEditor";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface RestaurantData {
  Name: string;
  Address: string;
  Description: string;
  Image: string;
  Open_time: string;
  Phone: string;
  State: string;
  TaxRate: string;
  ZipCode: string;
  physical_address: string;
  storeNameCHI: string;
}

interface WorkingHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

export default function StoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string | undefined;
  const isEditMode = !!storeId;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);

  const [data, setData] = useState<RestaurantData>({
    Name: "",
    Address: "",
    Description: "",
    Image: "",
    Open_time: "",
    Phone: "",
    State: "",
    TaxRate: "",
    ZipCode: "",
    physical_address: "",
    storeNameCHI: "",
  });

  // Fetch restaurant data from Firestore if in edit mode
  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "TitleLogoNameContent", storeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const restaurantData = docSnap.data() as RestaurantData;
          setData(restaurantData);

          // Parse working hours from Open_time JSON string
          if (restaurantData.Open_time) {
            try {
              const parsedHours = JSON.parse(restaurantData.Open_time);
              setWorkingHours(parsedHours);
            } catch (e) {
              console.error("Error parsing working hours:", e);
            }
          }
        } else {
          setError("Restaurant not found");
        }
      } catch (err: any) {
        console.error("Error fetching restaurant data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [storeId, isEditMode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement Firebase update/create
      setTimeout(() => {
        setSaving(false);
        const action = isEditMode ? "updated" : "created";
        Alert.alert("Success", `Store ${action} successfully`, [
          { text: "OK", onPress: () => router.back() },
        ]);
      }, 1000);
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", `Failed to ${isEditMode ? "update" : "create"} store data`);
    }
  };

  const updateField = (field: keyof RestaurantData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkingHoursChange = (value: string) => {
    updateField("Open_time", value);
    try {
      const parsed = JSON.parse(value);
      setWorkingHours(parsed);
    } catch (e) {
      console.error("Error parsing working hours", e);
    }
  };

  const screenTitle = isEditMode ? "Edit Store" : "Create Store";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title={screenTitle} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-4 text-slate-500">Loading store data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title={screenTitle} showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.tint}
          />
          <Text className="mt-4 text-center font-semibold text-slate-900 dark:text-white">
            Unable to Load Store
          </Text>
          <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title={screenTitle} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            {/* Basic Information */}
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Basic Information
              </Text>
              <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <Input
                  label="Store Name"
                  value={data.Name}
                  onChangeText={(v) => updateField("Name", v)}
                  placeholder="Restaurant Name"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Contact Information
              </Text>
              <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <Input
                  label="Phone"
                  value={data.Phone}
                  onChangeText={(v) => updateField("Phone", v)}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location */}
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Location
              </Text>
              <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <Input
                  label="Address"
                  value={data.Address}
                  onChangeText={(v) => updateField("Address", v)}
                  placeholder="Street Address"
                />
                <View className="mt-2 flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      label="State"
                      value={data.State}
                      onChangeText={(v) => updateField("State", v)}
                      placeholder="CA"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Zip Code"
                      value={data.ZipCode}
                      onChangeText={(v) => updateField("ZipCode", v)}
                      placeholder="94103"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description
              </Text>
              <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <Input
                  label="Description"
                  value={data.Description}
                  onChangeText={(v) => updateField("Description", v)}
                  placeholder="Short description..."
                  multiline
                  numberOfLines={3}
                  className="h-24 py-2"
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Working Hours Editor */}
            <View>
              <WorkingHoursEditor
                initialValue={data.Open_time || "{}"}
                onChange={handleWorkingHoursChange}
              />
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button
            label={isEditMode ? "Save Changes" : "Create Store"}
            onPress={handleSave}
            loading={saving}
            disabled={!data.Name}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
