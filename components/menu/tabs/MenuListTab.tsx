import { CategoryEditorModal } from "@/components/menu/modals/CategoryEditorModal";
import { GlobalChangesModal } from "@/components/menu/modals/GlobalChangesModal";
import {
  MenuEditorModal,
  type MenuEditorSavePayload,
} from "@/components/menu/modals/MenuEditorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useMenu } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  coerceAvailabilityPeriods,
  getMenuItemImageUrl,
} from "@/lib/pos/menuTransforms";
import { MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MenuListTabProps {
  onScanPress?: () => void;
  focusFirstCategoryVersion?: number;
}

export function MenuListTab({
  onScanPress,
  focusFirstCategoryVersion = 0,
}: MenuListTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const insets = useSafeAreaInsets();
  const bottomPadding = (responsive.isTablet ? 92 : 84) + insets.bottom;

  // Menu state from context
  const {
    categories,
    items,
    loading,
    error,
    saving,
    saveError,
    globalCustomizations,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    saveGlobalCustomizations,
  } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [globalModalVisible, setGlobalModalVisible] = useState(false);

  // Consolidated modal state
  const [itemModal, setItemModal] = useState<{
    visible: boolean;
    mode: "add" | "edit";
    item: MenuItem | null;
  }>({ visible: false, mode: "add", item: null });

  const [categoryModal, setCategoryModal] = useState<{
    visible: boolean;
    mode: "add" | "edit";
    category: { id: string; name: string; nameCN?: string } | null;
  }>({ visible: false, mode: "add", category: null });

  const firstCategoryId = categories[0]?.id ?? "";
  const selectedCategoryItem = categories.find((category) => category.id === selectedCategory);

  // Auto-select the first category once data arrives.
  useEffect(() => {
    if (categories.length === 0 && selectedCategory) {
      setSelectedCategory("");
      return;
    }
    if (
      categories.length > 0 &&
      (!selectedCategory ||
        !categories.some((category) => category.id === selectedCategory))
    ) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (focusFirstCategoryVersion > 0 && firstCategoryId) {
      setSelectedCategory(firstCategoryId);
      setSearchQuery("");
    }
  }, [firstCategoryId, focusFirstCategoryVersion]);

  // Memoize filtered items to avoid recalculation
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    // If searching, search globally (ignore category). Otherwise, filter by category.
    if (searchQuery) return matchesSearch;
    
    return item.categoryId === selectedCategory;
  });

  const handleAddItemPress = () => {
    if (!selectedCategory) return;
    setItemModal({ visible: true, mode: "add", item: null });
  };

  const handleEditItemPress = (item: MenuItem) => {
    setItemModal({ visible: true, mode: "edit", item });
  };

  const handleSaveItem = async (payload: MenuEditorSavePayload) => {
    if (itemModal.mode === "add" && selectedCategory) {
      const category = categories.find((item) => item.id === selectedCategory);
      await addItem({
        categoryId: selectedCategory,
        categoryName: category?.name,
        categoryNameCN: category?.nameCN,
        ...payload,
        attributesArr: payload.optionGroups ? undefined : {},
      });
    } else if (itemModal.mode === "edit" && itemModal.item) {
      const category = categories.find((item) => item.id === itemModal.item?.categoryId);
      await updateItem(itemModal.item.id, {
        categoryName: category?.name,
        categoryNameCN: category?.nameCN,
        ...payload,
        attributesArr: payload.optionGroups ? undefined : itemModal.item.attributesArr ?? {},
      });
    }
    setItemModal({ visible: false, mode: "add", item: null });
  };

  const handleAddCategoryPress = () => {
    setCategoryModal({ visible: true, mode: "add", category: null });
  };

  const handleEditCategoryPress = (id: string, name: string, nameCN?: string) => {
    setCategoryModal({ visible: true, mode: "edit", category: { id, name, nameCN } });
  };

  const handleRenameSelectedCategory = () => {
    if (!selectedCategoryItem) return;
    handleEditCategoryPress(
      selectedCategoryItem.id,
      selectedCategoryItem.name,
      selectedCategoryItem.nameCN
    );
  };

  const handleSaveCategory = async (payload: { name: string; nameCN?: string }) => {
    if (categoryModal.mode === "add") {
      const category = await addCategory(payload);
      setSelectedCategory(category.id);
    } else if (categoryModal.mode === "edit" && categoryModal.category) {
      await updateCategory(categoryModal.category.id, payload);
    }
    setCategoryModal({ visible: false, mode: "add", category: null });
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert(t("menu.deleteItemTitle"), t("menu.deleteItemMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteItem(id),
      },
    ]);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(t("menu.deleteCategoryTitle"), t("menu.deleteCategoryMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteCategory(id);
          // Auto-select first remaining category if available
          const remaining = categories.filter((c) => c.id !== id);
          setSelectedCategory(remaining[0]?.id || "");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color={colors.tint} />
        <Text className="mt-4 text-slate-500">{t("menu.loadingMenu")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4 dark:bg-slate-950">
        <Ionicons name="alert-circle-outline" size={48} color={colors.tint} />
        <Text className="mt-4 text-center font-semibold text-slate-900 dark:text-white">
          {t("menu.unableLoadMenu")}
        </Text>
        <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Toolbar */}
      <View 
        className="border-b border-slate-100 bg-white py-3 dark:border-slate-800 dark:bg-slate-950"
        style={{ paddingHorizontal: responsive.baseSpacing }}
      >
        {saveError ? (
          <Text className="mb-2 text-sm font-semibold text-red-600">
            {saveError}
          </Text>
        ) : null}
        <View className="gap-3">
          <Input
            placeholder={t("menu.searchPlaceholder")}
            icon="search"
            className="mb-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="flex-row items-center justify-between gap-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="min-w-0 flex-1"
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              <Button
                label={isTablet ? t("menu.aiScan") : "Scan"}
                size="sm"
                variant="outline"
                icon="scan"
                onPress={onScanPress}
              />
              <Button
                label={isTablet ? "Global Changes" : "Global"}
                size="sm"
                variant="outline"
                icon="settings-outline"
                disabled={saving}
                onPress={() => setGlobalModalVisible(true)}
              />
            </ScrollView>
            <Button
              label={isTablet ? "Add Item" : "Item"}
              size="sm"
              icon="add"
              disabled={!selectedCategory || saving}
              onPress={handleAddItemPress}
            />
          </View>
        </View>
      </View>

      {/* Categories Sidebar/TopBar */}
      <View className="border-b border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-center gap-2">
          <FlatList
            horizontal
            data={categories}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: responsive.baseSpacing, gap: 10 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              onLongPress={() => handleEditCategoryPress(item.id, item.name, item.nameCN)}
              delayLongPress={500}
              className={`min-h-[44px] justify-center rounded-full border px-4 ${
                selectedCategory === item.id
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <Text
                style={{ fontSize: responsive.baseFontSize - 1 }}
                className={`font-semibold ${
                  selectedCategory === item.id
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
            )}
          />
          <View className="mr-3 flex-row gap-2">
            <TouchableOpacity
              onPress={handleRenameSelectedCategory}
              disabled={!selectedCategoryItem || saving}
              className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <Ionicons name="create-outline" size={19} color={selectedCategoryItem ? colors.text : "#94a3b8"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCategoryPress}
              disabled={saving}
              className="h-11 w-11 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            >
              <Ionicons name="add" size={21} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Items Grid */}
      <FlatList
        key="menu-list"
        data={filteredItems}
        numColumns={1}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: responsive.baseSpacing,
          paddingBottom: bottomPadding,
          gap: 10,
        }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text
              style={{ fontSize: responsive.baseFontSize }}
              className="text-slate-500"
            >
              {t("menu.noItemsInCategory")}
            </Text>
            <Button
              label={t("menu.addFirstItem")}
              variant="outline"
              className="mt-4"
              onPress={handleAddItemPress}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View 
            className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <View
              className="flex-row items-center p-3"
              style={{ gap: isTablet ? 14 : 10 }}
            >
              <View
                className="items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800"
                style={{
                  width: isTablet ? 64 : 54,
                  height: isTablet ? 64 : 54,
                }}
              >
                <Image
                  source={{ uri: getMenuItemImageUrl(item) }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  style={{ fontSize: isTablet ? 15 : responsive.baseFontSize }}
                  className="font-bold text-slate-900 dark:text-white"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={{ fontSize: responsive.captionFontSize }}
                  className="mt-1 text-slate-500 dark:text-slate-400"
                  numberOfLines={1}
                >
                  {categories.find((category) => category.id === item.categoryId)?.name ?? ""}
                </Text>
                <Text className="mt-1 text-xs font-semibold text-slate-400" numberOfLines={1}>
                  {coerceAvailabilityPeriods(item.availability).join(" / ") ||
                    "Unavailable"}
                </Text>
              </View>

              <View
                className="items-end justify-center"
                style={{ width: isTablet ? 84 : 62 }}
              >
                <Text
                  style={{ fontSize: isTablet ? 16 : responsive.baseFontSize }}
                  className="font-bold text-orange-600"
                >
                  ${item.price.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-center gap-2">
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800"
                  disabled={saving}
                  onPress={() => handleEditItemPress(item)}
                >
                  <Ionicons name="pencil" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/20"
                  disabled={saving}
                  onPress={() => handleDeleteItem(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Modals */}
      <MenuEditorModal
        visible={itemModal.visible}
        mode={itemModal.mode}
        initialItemId={itemModal.item?.id}
        initialName={itemModal.item?.name}
        initialRawName={itemModal.item?.rawName}
        initialNameCN={itemModal.item?.nameCN}
        initialPrice={itemModal.item?.price}
        initialImageUrl={itemModal.item?.imageUrl}
        initialAvailability={itemModal.item?.availability}
        initialOptionGroups={itemModal.item?.optionGroups}
        initialIngredients={itemModal.item?.ingredients}
        saving={saving}
        onClose={() =>
          setItemModal({ visible: false, mode: "add", item: null })
        }
        onSave={handleSaveItem}
      />

      <CategoryEditorModal
        visible={categoryModal.visible}
        mode={categoryModal.mode}
        initialName={categoryModal.category?.name}
        initialNameCN={categoryModal.category?.nameCN}
        saving={saving}
        onClose={() =>
          setCategoryModal({ visible: false, mode: "add", category: null })
        }
        onSave={handleSaveCategory}
      />

      <GlobalChangesModal
        visible={globalModalVisible}
        initialItems={globalCustomizations}
        saving={saving}
        onClose={() => setGlobalModalVisible(false)}
        onSave={saveGlobalCustomizations}
      />
    </View>
  );
}
