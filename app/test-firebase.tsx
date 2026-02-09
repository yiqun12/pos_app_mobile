import { ScreenHeader } from "@/components/ui/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Fields matching the user request
interface RestaurantData {
  Name: string;
  Address: string;
  Description: string;
  Image: string;
  Open_time: string; // JSON string
  Phone: string;
  State: string;
  TaxRate: string;
  ZipCode: string;
  dailyPayout: boolean;
  globalModification: string; // JSON string
  key: string; // JSON string (Menu items)
  physical_address: string;
  restaurant_seat_arrangement: string; // JSON string
  storeNameCHI: string;
  storeOwnerId: string;
}

export default function TestFirebaseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching specific document ID based on user request/screenshot
              const docRef = doc(db, "TitleLogoNameContent", "aapp-sf-90011-38");
      
        const docSnap = await getDoc(docRef);

        // Fetching specific document ID based on user request/screenshot
        const docRef1 = doc(db, "TitleLogoNameContent", "23-sf-90011-960");
        const docSnap1c = await getDoc(docRef);

        if (docSnap.exists()) {
          // @ts-ignore
          setData(docSnap.data() as RestaurantData);
        } else {
          setError("No such document found (ID: 23-sf-90011-960)");
        }
      } catch (err: any) {
        console.error("Firestore Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderJsonField = (label: string, jsonString: string) => {
    try {
      if (!jsonString) return null;
      const parsed = JSON.parse(jsonString);
      return (
        <View className="mt-2 rounded bg-slate-100 p-2 dark:bg-slate-800">
          <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {JSON.stringify(parsed, null, 2)}
          </Text>
        </View>
      );
    } catch (e) {
      return <Text className="text-red-500">Invalid JSON: {jsonString}</Text>;
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Firebase Test" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-4 text-slate-500">
            Fetching restaurant data...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-red-500">{error}</Text>
        </View>
      ) : data ? (
        <ScrollView className="flex-1 px-4 py-4">
          {/* Header Info */}
          <View className="mb-6 flex-row items-start gap-4">
            {data.Image && (
              <Image
                source={{ uri: data.Image }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
            )}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.Name}
              </Text>
              <Text className="text-lg text-slate-700 dark:text-slate-300">
                {data.storeNameCHI}
              </Text>
              <Text className="text-slate-500">{data.Description}</Text>
            </View>
          </View>

          {/* Details Card */}
          <View className="mb-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <Text className="mb-2 font-semibold text-slate-900 dark:text-white">
              Contact & Location
            </Text>
            <Text className="text-slate-600 dark:text-slate-400">
              Phone: {data.Phone}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400">
              Address: {data.Address}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400">
              {data.physical_address}, {data.State} {data.ZipCode}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400">
              Tax Rate: {data.TaxRate}%
            </Text>
          </View>

          {/* JSON Data Sections */}
          <View className="gap-4 pb-10">
            <View>
              <Text className="font-semibold text-slate-900 dark:text-white">
                Opening Times
              </Text>
              {renderJsonField("Open_time", data.Open_time)}
            </View>

            <View>
              <Text className="font-semibold text-slate-900 dark:text-white">
                Menu Items (Key)
              </Text>
              {/* This one might be huge, maybe truncate? */}
              {renderJsonField("key", data.key)}
            </View>

            <View>
              <Text className="font-semibold text-slate-900 dark:text-white">
                Global Modifications
              </Text>
              {renderJsonField("globalModification", data.globalModification)}
            </View>

            <View>
              <Text className="font-semibold text-slate-900 dark:text-white">
                Seat Arrangement
              </Text>
              {renderJsonField(
                "restaurant_seat_arrangement",
                data.restaurant_seat_arrangement
              )}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
