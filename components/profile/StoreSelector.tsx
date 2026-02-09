import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface Store {
  id: string;
  name: string;
  nameCHI?: string;
  address: string;
  isActive?: boolean;
}

interface StoreSelectorProps {
  visible: boolean;
  stores: Store[];
  currentStoreId?: string;
  onSelect: (store: Store) => void;
  onClose: () => void;
  onCreateStore?: () => void;
}

export function StoreSelector({
  visible,
  stores,
  currentStoreId,
  onSelect,
  onClose,
  onCreateStore,
}: StoreSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const renderStore = ({ item }: { item: Store }) => {
    const isSelected = item.id === currentStoreId;

    return (
      <TouchableOpacity
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
        className={`mb-3 rounded-xl border-2 p-4 ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <View className="flex-row items-center">
          {/* Store Icon */}
          <View
            className={`mr-3 h-12 w-12 items-center justify-center rounded-xl ${
              isSelected
                ? "bg-blue-600"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            <Ionicons
              name="storefront"
              size={24}
              color={isSelected ? "white" : colors.tabIconDefault}
            />
          </View>

          {/* Store Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className={`text-base font-semibold ${
                  isSelected
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {item.name}
              </Text>
              {item.nameCHI && (
                <Text className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {item.nameCHI}
                </Text>
              )}
            </View>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {item.address}
            </Text>
          </View>

          {/* Selected Indicator */}
          {isSelected && (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-600">
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <TouchableOpacity
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            Select Store
          </Text>
          <View className="w-10" />
        </View>

        {/* Store List */}
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Ionicons
                name="storefront-outline"
                size={64}
                color={colors.tabIconDefault}
              />
              <Text className="mt-4 text-slate-500 dark:text-slate-400">
                No stores found
              </Text>
            </View>
          }
        />

        {/* Create Store Button */}
        {onCreateStore && (
          <View className="absolute bottom-8 left-4 right-4">
            <TouchableOpacity
              onPress={onCreateStore}
              activeOpacity={0.7}
              className="flex-row items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 dark:border-slate-600 dark:bg-slate-900"
            >
              <Ionicons name="add-circle" size={24} color="#2563eb" />
              <Text className="ml-2 text-base font-semibold text-blue-600 dark:text-blue-400">
                Create New Store
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

