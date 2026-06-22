import { OrderItem, SelectedGlobalCustomization, SelectedOption } from "@/components/seats/types";
import { Colors } from "@/constants/theme";
import { useMenu } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  DEFAULT_MENU_IMAGE_URL,
  resolveMenuImageUrl,
} from "@/lib/pos/menuTransforms";
import { isTableTimingMenuItem } from "@/lib/pos/tableTiming";
import { MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ItemOptionsModal } from "./ItemOptionsModal";

interface MenuSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: OrderItem) => void;
}

export function MenuSelectionModal({
  visible,
  onClose,
  onSelect,
}: MenuSelectionModalProps) {
  const {
    categories,
    items,
    loading,
    error,
  } = useMenu();
  const { t } = useTranslation();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(() => new Set());

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory) {
      result = result.filter((i) => i.categoryId === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedCategory, searchQuery]);

  const buildPlainOrderItem = (item: MenuItem): OrderItem => ({
    id: `item-${Date.now()}`,
    menuItemId: item.id,
    name: item.name,
    rawName: item.rawName,
    nameCN: item.nameCN,
    price: item.price,
    quantity: 1,
    imageUrl: item.imageUrl,
    attributesArr: item.attributesArr,
  });

  const handleQuickAddItem = (item: MenuItem) => {
    onSelect(buildPlainOrderItem(item));
    onClose();
  };

  const handleItemEditPress = (item: MenuItem) => {
    if (isTableTimingMenuItem(item)) {
      handleQuickAddItem(item);
      return;
    }
    setSelectedMenuItem(item);
    setShowOptionsModal(true);
  };

  const handleItemPress = (item: MenuItem) => {
    if (isTableTimingMenuItem(item)) {
      handleQuickAddItem(item);
      return;
    }

    const hasWebAttributes = Object.values(item.attributesArr ?? {}).some(
      (group) => (group.variations?.length ?? 0) > 0
    );
    if (item.optionGroups && item.optionGroups.length > 0) {
      // Show options modal if item has customization options
      setSelectedMenuItem(item);
      setShowOptionsModal(true);
    } else if (item.ingredients && item.ingredients.length > 0) {
      // Show options modal if item has ingredients
      setSelectedMenuItem(item);
      setShowOptionsModal(true);
    } else if (hasWebAttributes) {
      setSelectedMenuItem(item);
      setShowOptionsModal(true);
    } else {
      // No options, add directly
      handleQuickAddItem(item);
    }
  };

  const handleOptionsConfirm = (
    selectedOptions: SelectedOption[],
    selectedIngredients: {
      id: string;
      name: string;
      priceAdjustment?: number;
    }[],
    selectedGlobalCustomizations?: SelectedGlobalCustomization[]
  ) => {
    if (!selectedMenuItem) return;

    // Calculate price adjustments
    let priceAdjustment = 0;
    selectedOptions.forEach((option) => {
      option.selectedChoices.forEach((choice) => {
        priceAdjustment += choice.priceAdjustment ?? 0;
      });
    });
    selectedIngredients.forEach((ingredient) => {
      priceAdjustment += ingredient.priceAdjustment ?? 0;
    });
    // Add global customization price adjustments
    selectedGlobalCustomizations?.forEach((customization) => {
      priceAdjustment += customization.price ?? 0;
    });

    // Create order item with selections
    const orderItem: OrderItem = {
      id: `item-${Date.now()}`,
      menuItemId: selectedMenuItem.id,
      name: selectedMenuItem.name,
      rawName: selectedMenuItem.rawName,
      nameCN: selectedMenuItem.nameCN,
      price: selectedMenuItem.price + priceAdjustment,
      quantity: 1,
      imageUrl: selectedMenuItem.imageUrl,
      attributesArr: selectedMenuItem.attributesArr,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
      selectedIngredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
      selectedGlobalCustomizations: selectedGlobalCustomizations && selectedGlobalCustomizations.length > 0 
        ? selectedGlobalCustomizations 
        : undefined,
    };

    onSelect(orderItem);
    setShowOptionsModal(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !showOptionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-white dark:bg-slate-950">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Text
              style={{ fontSize: responsive.headingFontSize }}
              className="font-bold text-slate-900 dark:text-white"
            >
              {t("menu.selection.selectItem")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator
                size="large"
                color={colors.tint}
              />
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="mt-4 text-slate-500"
              >
                {t("menu.loadingMenu")}
              </Text>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <View className="flex-1 items-center justify-center px-4">
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.tint}
              />
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="mt-4 text-center font-semibold text-slate-900 dark:text-white"
              >
                {t("menu.unableLoadMenu")}
              </Text>
              <Text
                style={{ fontSize: responsive.baseFontSize - 2 }}
                className="mt-2 text-center text-slate-600 dark:text-slate-400"
              >
                {error}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-2"
              >
                <Text className="text-center font-semibold text-white">
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Menu Content (only show if not loading and no error) */}
          {!loading && !error && (
            <>
              {/* Search */}
              <View className="px-4 py-2">
                <View className="flex-row items-center rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <Ionicons
                    name="search"
                    size={20}
                    color={colors.tabIconDefault}
                  />
                  <TextInput
                    style={{ fontSize: responsive.baseFontSize }}
                    className="ml-2 flex-1 text-slate-900 dark:text-white"
                    placeholder={t("menu.selection.searchItems")}
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Categories (Horizontal Scroll) */}
              <View className="py-2">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(null)}
                    className={`rounded-full px-4 py-2 ${
                      !selectedCategory
                        ? "bg-blue-600"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <Text
                      style={{ fontSize: responsive.baseFontSize }}
                      className={`font-semibold ${
                        !selectedCategory
                          ? "text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {t("menu.selection.all")}
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      className={`rounded-full px-4 py-2 ${
                        selectedCategory === cat.id
                          ? "bg-blue-600"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className={`font-semibold ${
                          selectedCategory === cat.id
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Items Grid */}
              <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {filteredItems.map((item) => {
                    const isTableTimingItem = isTableTimingMenuItem(item);
                    const imageKey = `${item.id}:${item.imageUrl ?? ""}`;
                    const itemImageUrl = failedImageKeys.has(imageKey)
                      ? DEFAULT_MENU_IMAGE_URL
                      : resolveMenuImageUrl(item.imageUrl);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleItemPress(item)}
                        className="w-[48%] rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:opacity-70 dark:border-slate-800 dark:bg-slate-900"
                      >
                      <View className="mb-2 h-24 w-full overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Image
                          source={{ uri: itemImageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                          transition={120}
                          onError={() => {
                            if (itemImageUrl === DEFAULT_MENU_IMAGE_URL) return;
                            setFailedImageKeys((current) => {
                              const next = new Set(current);
                              next.add(imageKey);
                              return next;
                            });
                          }}
                        />
                      </View>
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="mb-1 font-semibold text-slate-900 dark:text-white"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{ fontSize: responsive.baseFontSize - 2 }}
                        className="text-slate-500 dark:text-slate-400"
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                      <View className="mt-3 flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={(event) => {
                            event.stopPropagation();
                            if (isTableTimingItem) handleQuickAddItem(item);
                            else handleItemEditPress(item);
                          }}
                          className={`flex-row items-center rounded-md border px-2.5 py-1.5 ${
                            isTableTimingItem
                              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                              : "border-slate-400 dark:border-slate-600"
                          }`}
                        >
                          <Ionicons
                            name={isTableTimingItem ? "time-outline" : "create-outline"}
                            size={14}
                            color={isTableTimingItem ? "#2563eb" : colors.text}
                          />
                          <Text
                            style={{ fontSize: responsive.captionFontSize }}
                            className={`ml-1 font-semibold ${
                              isTableTimingItem
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {isTableTimingItem ? "Start Table" : "Edit"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(event) => {
                            event.stopPropagation();
                            handleQuickAddItem(item);
                          }}
                          className="h-8 w-8 items-center justify-center rounded-full border border-slate-400 dark:border-slate-600"
                        >
                          <Ionicons name="add" size={18} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      {!isTableTimingItem && (item.optionGroups?.length || 0) > 0 && (
                        <View className="mt-2 flex-row items-center">
                          <Ionicons
                            name="settings-outline"
                            size={14}
                            color={colors.tabIconDefault}
                          />
                          <Text
                            style={{ fontSize: responsive.captionFontSize }}
                            className="ml-1 text-slate-500"
                          >
                            {t("menu.selection.customizable")}
                          </Text>
                        </View>
                      )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredItems.length === 0 && (
                  <View className="py-10 items-center">
                    <Text
                      style={{ fontSize: responsive.baseFontSize }}
                      className="text-slate-500"
                    >
                      {t("menu.selection.noItemsFound")}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
          </View>
      </Modal>

      {/* Item Options Modal */}
      <ItemOptionsModal
        visible={showOptionsModal}
        item={selectedMenuItem}
        onClose={() => setShowOptionsModal(false)}
        onConfirm={handleOptionsConfirm}
      />
    </>
  );
}
