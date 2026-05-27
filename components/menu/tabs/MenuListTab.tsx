import { CategoryEditorModal } from "@/components/menu/modals/CategoryEditorModal";
import { MenuEditorModal } from "@/components/menu/modals/MenuEditorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useMenu } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MenuListTabProps {
  onScanPress?: () => void;
}

export function MenuListTab({ onScanPress }: MenuListTabProps) {
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
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
  } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Consolidated modal state
  const [itemModal, setItemModal] = useState<{
    visible: boolean;
    mode: "add" | "edit";
    item: MenuItem | null;
  }>({ visible: false, mode: "add", item: null });

  const [categoryModal, setCategoryModal] = useState<{
    visible: boolean;
    mode: "add" | "edit";
    category: { id: string; name: string } | null;
  }>({ visible: false, mode: "add", category: null });

  // Responsive columns
  const numColumns = responsive.isLargeTablet ? 3 : responsive.isTablet ? 2 : 1;

  // Auto-select the first category once data arrives.
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

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

  const handleSaveItem = (name: string, price: number) => {
    if (itemModal.mode === "add" && selectedCategory) {
      addItem({ categoryId: selectedCategory, name, price });
    } else if (itemModal.mode === "edit" && itemModal.item) {
      updateItem(itemModal.item.id, { name, price });
    }
    setItemModal({ visible: false, mode: "add", item: null });
  };

  const handleAddCategoryPress = () => {
    setCategoryModal({ visible: true, mode: "add", category: null });
  };

  const handleEditCategoryPress = (id: string, name: string) => {
    setCategoryModal({ visible: true, mode: "edit", category: { id, name } });
  };

  const handleSaveCategory = (name: string) => {
    if (categoryModal.mode === "add") {
      addCategory(name);
    } else if (categoryModal.mode === "edit" && categoryModal.category) {
      updateCategory(categoryModal.category.id, name);
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
        className="border-b border-slate-100 py-2 dark:border-slate-800"
        style={{ paddingHorizontal: responsive.baseSpacing }}
      >
        <View className={isTablet ? "flex-row items-center gap-2" : "gap-2"}>
          <View className="min-w-0 flex-1">
            <Input
            placeholder={t("menu.searchPlaceholder")}
            icon="search"
            className="mb-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            />
          </View>
          <View className="flex-row gap-2">
            <Button
              label={isTablet ? t("menu.aiScan") : "Scan"}
              size="sm"
              variant="outline"
              icon="scan"
              onPress={onScanPress}
            />
            <Button
              label={isTablet ? "Category" : "Cat."}
              size="sm"
              variant="outline"
              icon="folder"
              onPress={handleAddCategoryPress}
            />
            <Button
              label={isTablet ? "Add Item" : "Item"}
              size="sm"
              icon="add"
              disabled={!selectedCategory}
              onPress={handleAddItemPress}
            />
          </View>
        </View>
      </View>

      {/* Categories Sidebar/TopBar */}
      <View className="border-b border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: responsive.baseSpacing, gap: 8 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              onLongPress={() => handleEditCategoryPress(item.id, item.name)}
              delayLongPress={500}
              className={`rounded-full border px-3 py-2 ${
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
          ListFooterComponent={
            <TouchableOpacity
              onPress={handleAddCategoryPress}
              className="h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Items Grid */}
      <FlatList
        key={numColumns} // Force re-render on layout change
        data={filteredItems}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: responsive.baseSpacing,
          paddingBottom: bottomPadding,
          gap: numColumns > 1 ? responsive.baseSpacing : 0,
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
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            style={
              numColumns > 1
                ? {
                    flex: 1,
                    marginHorizontal: responsive.baseSpacing / 2,
                    marginBottom: responsive.baseSpacing,
                  }
                : { marginBottom: 10 }
            }
          >
            <View className="flex-row p-3">
              <View className="mr-3 h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="fast-food" size={26} color="#cbd5e1" />
                )}
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  style={{ fontSize: responsive.baseFontSize }}
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
                <Text
                  style={{ fontSize: responsive.baseFontSize }}
                  className="mt-2 font-bold text-orange-600"
                >
                  ${item.price.toFixed(2)}
                </Text>
              </View>

              <View className="ml-2 justify-center gap-2">
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800"
                  onPress={() => handleEditItemPress(item)}
                >
                  <Ionicons name="pencil" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/20"
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
        initialName={itemModal.item?.name}
        initialPrice={itemModal.item?.price}
        onClose={() =>
          setItemModal({ visible: false, mode: "add", item: null })
        }
        onSave={handleSaveItem}
      />

      <CategoryEditorModal
        visible={categoryModal.visible}
        mode={categoryModal.mode}
        initialName={categoryModal.category?.name}
        onClose={() =>
          setCategoryModal({ visible: false, mode: "add", category: null })
        }
        onSave={handleSaveCategory}
      />
    </View>
  );
}
