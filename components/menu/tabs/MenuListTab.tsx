import { CategoryEditorModal } from "@/components/menu/modals/CategoryEditorModal";
import { MenuEditorModal } from "@/components/menu/modals/MenuEditorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { db } from "@/lib/firebase";
import { MenuCategory, MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
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

// Mock data for development/testing
const MOCK_MENU_DATA = [
  {
    name: "Filet Mignon",
    category: "Steak Cuts",
    price: 45.99,
    image: "https://via.placeholder.com/150",
    attributes: [
      {
        id: "opt1",
        name: "Doneness",
        type: "single",
        required: true,
        choices: [],
      },
      {
        id: "opt2",
        name: "Sauce",
        type: "single",
        required: false,
        choices: [],
      },
    ],
    attributes2: [
      { id: "add1", name: "Extra Butter" },
      { id: "add2", name: "Garlic" },
      { id: "add3", name: "Truffle Oil" },
    ],
  },
  {
    name: "Rib Eye Steak",
    category: "Steak Cuts",
    price: 52.99,
    image: "https://via.placeholder.com/150",
    attributes: [
      {
        id: "opt1",
        name: "Doneness",
        type: "single",
        required: true,
        choices: [],
      },
    ],
    attributes2: [
      { id: "add1", name: "Chimichurri" },
      { id: "add2", name: "Sea Salt Crust" },
    ],
  },
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 16.99,
    image: "https://via.placeholder.com/150",
    attributes: [
      { id: "opt1", name: "Size", type: "single", required: true, choices: [] },
      {
        id: "opt2",
        name: "Crust Type",
        type: "single",
        required: false,
        choices: [],
      },
    ],
    attributes2: [
      { id: "add1", name: "Extra Cheese" },
      { id: "add2", name: "Pepperoni" },
      { id: "add3", name: "Basil" },
    ],
  },
  {
    name: "Caesar Salad",
    category: "Salads",
    price: 14.99,
    image: "https://via.placeholder.com/150",
    attributes: [],
    attributes2: [
      { id: "add1", name: "Grilled Chicken" },
      { id: "add2", name: "Shrimp" },
      { id: "add3", name: "Bacon" },
      { id: "add4", name: "Croutons" },
    ],
  },
  {
    name: "Grilled Salmon",
    category: "Seafood",
    price: 38.99,
    image: "https://via.placeholder.com/150",
    attributes: [
      {
        id: "opt1",
        name: "Temperature",
        type: "single",
        required: true,
        choices: [],
      },
    ],
    attributes2: [
      { id: "add1", name: "Lemon Butter" },
      { id: "add2", name: "Dill" },
    ],
  },
  {
    name: "Lobster Tail",
    category: "Seafood",
    price: 65.99,
    image: "https://via.placeholder.com/150",
    attributes: [
      { id: "opt1", name: "Size", type: "single", required: true, choices: [] },
      {
        id: "opt2",
        name: "Cooking Style",
        type: "single",
        required: true,
        choices: [],
      },
    ],
    attributes2: [
      { id: "add1", name: "Drawn Butter" },
      { id: "add2", name: "Garlic" },
    ],
  },
  {
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 9.99,
    image: "https://via.placeholder.com/150",
    attributes: [],
    attributes2: [
      { id: "add1", name: "Vanilla Ice Cream" },
      { id: "add2", name: "Whipped Cream" },
      { id: "add3", name: "Berries" },
    ],
  },
  {
    name: "Tiramisu",
    category: "Desserts",
    price: 8.99,
    image: "https://via.placeholder.com/150",
    attributes: [],
    attributes2: [],
  },
];

/**
 * Parses menu items from Firestore's "key" field (JSON string)
 * Expected format: [{ name, category, price, image, ... }, ...]
 */
function parseMenuData(jsonString: string): {
  categories: MenuCategory[];
  items: MenuItem[];
} {
  try {
    if (!jsonString) {
      return { categories: [], items: [] };
    }

    const parsed = JSON.parse(jsonString);
    const categoriesMap = new Map<string, MenuCategory>();
    const items: MenuItem[] = [];
    let itemId = 1;
    let categoryCount = 0;

    if (Array.isArray(parsed)) {
      parsed.forEach((item: any) => {
        const categoryName = item.category || "Uncategorized";

        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            id: `cat-${categoryCount + 1}`,
            name: categoryName,
          });
          categoryCount++;
        }

        const categoryId = categoriesMap.get(categoryName)!.id;

        items.push({
          id: `item-${itemId++}`,
          categoryId,
          name: item.name || "Unknown Item",
          price: parseFloat(item.price || 0),
          description: item.description,
          imageUrl: item.image,
          optionGroups: item.attributes || item.optionGroups,
          ingredients:
            item.attributes2 || item.attributesArr || item.ingredients,
        });
      });
    }

    const categories = Array.from(categoriesMap.values());
    return { categories, items };
  } catch (error) {
    console.error("Error parsing menu data:", error);
    return { categories: [], items: [] };
  }
}

export function MenuListTab({ onScanPress }: MenuListTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const insets = useSafeAreaInsets();
  const floatingBottomOffset = (responsive.isTablet ? 124 : 116) + insets.bottom;

  // Menu state
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
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
  const numColumns = responsive.isTablet ? 3 : 1;

  // Fetch menu data from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        setDataNotice(null);

        const docRef = doc(db, "TitleLogoNameContent", "aapp-sf-90011-38");
        const docSnap = await getDoc(docRef);

        const data = docSnap.exists()
          ? (docSnap.data() as { key?: string })
          : null;
        const jsonData = data?.key || JSON.stringify(MOCK_MENU_DATA);
        const usingMock = !docSnap.exists() || !data?.key;

        console.log("jsonData: ", data);
        const { categories: parsedCategories, items: parsedItems } =
          parseMenuData(jsonData);

        setCategories(parsedCategories);
        setItems(parsedItems);
        setDataNotice(
          usingMock ? t("menu.menuCloudMissing") : null
        );

        if (parsedCategories.length > 0) {
          setSelectedCategory(parsedCategories[0].id);
        }
      } catch (err: any) {
        console.log("Error fetching menu (using mock):", err);
        const { categories: parsedCategories, items: parsedItems } =
          parseMenuData(JSON.stringify(MOCK_MENU_DATA));

        setCategories(parsedCategories);
        setItems(parsedItems);
        setDataNotice(t("menu.menuDbFailed"));

        if (parsedCategories.length > 0) {
          setSelectedCategory(parsedCategories[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchMenu();
  }, [t]);

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
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        categoryId: selectedCategory,
        name,
        price,
      };
      setItems((prev) => [...prev, newItem]);
    } else if (itemModal.mode === "edit" && itemModal.item) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemModal.item!.id ? { ...item, name, price } : item,
        ),
      );
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
      const newCategory: MenuCategory = {
        id: `cat-${Date.now()}`,
        name,
      };
      setCategories((prev) => [...prev, newCategory]);
    } else if (categoryModal.mode === "edit" && categoryModal.category) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryModal.category!.id ? { ...cat, name } : cat,
        ),
      );
    }
    setCategoryModal({ visible: false, mode: "add", category: null });
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert(t("menu.deleteItemTitle"), t("menu.deleteItemMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          setItems((prev) => prev.filter((item) => item.id !== id)),
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
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
          setItems((prev) => prev.filter((item) => item.categoryId !== id));
          // Auto-select first category if available
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
      {dataNotice ? (
        <View className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <Text className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {dataNotice}
          </Text>
        </View>
      ) : null}

      {/* Search Bar */}
      <View 
        className="py-2 border-b border-slate-100 dark:border-slate-800"
        style={{ paddingHorizontal: responsive.mediumSpacing }}
      >
        <Input 
            placeholder={t("menu.searchPlaceholder")}
            icon="search"
            className="mb-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Sidebar/TopBar */}
      <View className="border-b border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: responsive.mediumSpacing, gap: 12 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              onLongPress={() => handleEditCategoryPress(item.id, item.name)}
              delayLongPress={500}
              className={`pb-2 px-3 ${
                selectedCategory === item.id
                  ? "border-b-2 border-orange-500"
                  : "border-b-2 border-transparent"
              }`}
            >
              <Text
                style={{ fontSize: responsive.baseFontSize }}
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
              className="px-3 pb-2 border-b-2 border-transparent opacity-50"
            >
              <Ionicons name="add" size={20} color={colors.text} />
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
          padding: responsive.mediumSpacing,
          paddingBottom: floatingBottomOffset + 92,
          gap: numColumns > 1 ? responsive.mediumSpacing : 0,
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
            className="rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
            style={
              numColumns > 1
                ? {
                    flex: 1,
                    marginHorizontal: responsive.mediumSpacing / 2,
                    marginBottom: responsive.mediumSpacing,
                  }
                : { marginBottom: 16 }
            }
          >
            {/* Image Placeholder */}
            <View className="h-40 w-full items-center justify-center bg-slate-100 dark:bg-slate-800 relative">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="fast-food" size={48} color="#cbd5e1" />
              )}
              
              {/* Floating Action Buttons on Card */}
              <View className="absolute top-2 right-2 flex-row gap-2">
                 <TouchableOpacity 
                    className="bg-white/90 p-2 rounded-full shadow-sm dark:bg-slate-800/90"
                    onPress={() => handleEditItemPress(item)}
                 >
                    <Ionicons name="pencil" size={16} color={colors.text} />
                 </TouchableOpacity>
              </View>

              {/* Stock Badge (Mock) */}
              {Math.random() > 0.8 && (
                  <View className="absolute bottom-2 right-2 bg-red-500 px-2 py-1 rounded">
                      <Text
                        className="text-white font-bold"
                        style={{ fontSize: isTablet ? 13 : 12 }}
                      >
                        {t("menu.outOfStock")}
                      </Text>
                  </View>
              )}
            </View>

            <View className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text
                    style={{ fontSize: responsive.subheadingFontSize }}
                    className="font-bold text-slate-900 dark:text-white flex-1 mr-2"
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
                <Text
                    style={{ fontSize: responsive.subheadingFontSize }}
                    className="font-bold text-orange-500"
                >
                    ${item.price.toFixed(2)}
                </Text>
              </View>
              
              {/* Mock Stock Status */}
              <View className="flex-row justify-between items-center mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                 <Text
                   className="text-slate-500"
                   style={{ fontSize: isTablet ? 14 : 12 }}
                  >
                    {t("menu.stockStatus")}
                  </Text>
                 <View className="flex-row items-center gap-2">
                    <View className="w-8 h-4 bg-green-100 rounded-full items-end px-1 justify-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full" />
                    </View>
                    <Text
                      className="text-green-600 font-medium"
                      style={{ fontSize: isTablet ? 14 : 12 }}
                    >
                      {t("menu.inStock")}
                    </Text>
                 </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Floating Action Buttons */}
      <View
        className="absolute right-6 items-end gap-4"
        style={{ bottom: floatingBottomOffset }}
      >
        {/* AI Scanner FAB */}
        <TouchableOpacity
          onPress={onScanPress}
          className="flex-row items-center rounded-full bg-indigo-600 px-4 py-3 shadow-lg"
        >
          <Ionicons name="scan" size={20} color="white" />
          <Text className="ml-2 font-semibold text-white">{t("menu.aiScan")}</Text>
        </TouchableOpacity>

        {/* Add Item FAB */}
        {selectedCategory && (
          <TouchableOpacity
            onPress={handleAddItemPress}
            className="h-14 w-14 items-center justify-center rounded-full bg-orange-500 shadow-lg"
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        )}
      </View>

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
