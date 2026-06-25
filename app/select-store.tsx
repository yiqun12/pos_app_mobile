import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectStoreScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { storeList, isLoading, error, setCurrentStoreId, reloadStoreList } =
    useStoreSelection();

  const handleSelect = async (id: string) => {
    await setCurrentStoreId(id);
    router.replace("/(tabs)/seats");
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title="Select Store" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-slate-500">Loading stores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title="Select Store" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-red-600">{error.message}</Text>
          <Button label="Retry" onPress={reloadStoreList} />
          <Button label="Sign out" onPress={logout} variant="outline" className="mt-3" />
        </View>
      </SafeAreaView>
    );
  }

  if (storeList.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <ScreenHeader title="Select Store" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center font-semibold text-slate-900 dark:text-white">
            No stores found
          </Text>
          <Text className="mb-4 text-center text-slate-500">
            Create a store on the eatify web admin first.
          </Text>
          <Button label="Sign out" onPress={logout} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <ScreenHeader title="Select Store" />
      <FlatList
        data={storeList}
        keyExtractor={(s) => s.id}
        contentContainerClassName="p-4 gap-3"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item.id)}
            className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }}
              />
            ) : (
              <View className="mr-3 h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900" />
            )}
            <View className="flex-1">
              <Text className="font-semibold text-slate-900 dark:text-white">
                {item.name}
              </Text>
              {item.nameCN ? (
                <Text className="text-sm text-slate-500">{item.nameCN}</Text>
              ) : null}
              <Text className="mt-1 text-xs text-slate-400">{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
