import { WorkingHoursEditor } from "@/components/profile/WorkingHoursEditor";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
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
  TouchableOpacity,
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
  const responsive = useResponsiveLayout();

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
        <ScrollView 
          className="flex-1"
          style={{ padding: responsive.mediumSpacing }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col md:flex-row gap-4">
            
            {/* Left Column: Store Info */}
            <View className="flex-1 gap-4">
                {/* Store Information Card */}
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">Store Information</Text>
                        <TouchableOpacity className="border border-slate-200 rounded-lg px-3 py-1 dark:border-slate-700">
                            <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">Edit</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logo Placeholder */}
                    <View className="flex-row items-start mb-6">
                        <View className="w-24 h-24 bg-orange-100 rounded-xl items-center justify-center mr-4 border-2 border-dashed border-orange-200">
                            <Ionicons name="image-outline" size={32} color="#f97316" />
                        </View>
                        <View className="flex-1 gap-2">
                            <View>
                                <Text className="text-xs text-slate-500 uppercase font-bold">STORE NAME</Text>
                                <Input
                                    value={data.Name}
                                    onChangeText={(v) => updateField("Name", v)}
                                    placeholder="Store Name"
                                    className="mb-0"
                                />
                            </View>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 uppercase font-bold">TAX RATE</Text>
                                    <Text className="text-base font-medium text-slate-900 dark:text-white">8.5%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="gap-4">
                        <View>
                            <Text className="text-xs text-slate-500 uppercase font-bold mb-1">ADDRESS</Text>
                            <Input
                                value={data.Address}
                                onChangeText={(v) => updateField("Address", v)}
                                placeholder="Street Address"
                                className="mb-0"
                            />
                        </View>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-xs text-slate-500 uppercase font-bold mb-1">PHONE</Text>
                                <Text className="text-base font-medium text-slate-900 dark:text-white">+1 (555) 000-1234</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-slate-500 uppercase font-bold mb-1">WEBSITE URL</Text>
                                <Text className="text-base font-medium text-orange-600">www.demostore.com</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Integration Card */}
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Integration</Text>
                    <Text className="text-slate-500 mb-4">Receive payments directly through Stripe.</Text>
                    <Button label="Connect with Stripe" icon="link" className="bg-indigo-600 border-indigo-600" />
                </View>

                {/* Store QR Code */}
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900 flex-row items-center gap-4">
                    <View className="w-16 h-16 bg-slate-100 items-center justify-center rounded-lg">
                        <Ionicons name="qr-code" size={32} color="#334155" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">Store QR Code</Text>
                        <Text className="text-slate-500 text-sm">Print this code for customers to scan menu.</Text>
                    </View>
                    <Button label="Print QR" size="sm" variant="secondary" icon="print" />
                </View>
            </View>

            {/* Right Column: Business Hours & Security */}
            <View className="flex-1 gap-4">
                {/* Business Hours Card */}
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">Business Hours</Text>
                    <Text className="text-slate-500 mb-6 text-sm">Set your operating schedule for each day.</Text>
                    
                    <WorkingHoursEditor
                        initialValue={data.Open_time || "{}"}
                        onChange={handleWorkingHoursChange}
                    />
                    
                    <Button label="Apply to all days" variant="secondary" className="mt-4 bg-orange-50 text-orange-600 border-orange-100" />
                </View>

                {/* Security Card */}
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Security</Text>
                    <Text className="text-slate-500 mb-4">Update your account access credentials.</Text>
                    <Button label="Reset Password" variant="outline" className="w-full" />
                </View>
            </View>

          </View>
        </ScrollView>

        <View 
          className="border-t border-slate-200 dark:border-slate-800"
          style={{ padding: responsive.mediumSpacing }}
        >
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
