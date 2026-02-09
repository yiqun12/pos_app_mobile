import { CategoryEditorModal } from "@/components/menu/modals/CategoryEditorModal";
import { MenuEditorModal } from "@/components/menu/modals/MenuEditorModal";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { db } from "@/lib/firebase";
import { MenuCategory, MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  // Menu state
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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

  // Fetch menu data from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "TitleLogoNameContent", "aapp-sf-90011-38");
        const docSnap = await getDoc(docRef);

        const data = docSnap.exists()
          ? (docSnap.data() as { key?: string })
          : null;
        const jsonData = data?.key || JSON.stringify(MOCK_MENU_DATA);

        console.log("jsonData: ", data);
        const { categories: parsedCategories, items: parsedItems } =
          parseMenuData(jsonData);

        setCategories(parsedCategories);
        setItems(parsedItems);

        if (parsedCategories.length > 0) {
          setSelectedCategory(parsedCategories[0].id);
        }
      } catch (err: any) {
        console.error("Error fetching menu:", err);
        setError(err.message || "Failed to fetch menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Memoize filtered items to avoid recalculation
  const filteredItems = items.filter(
    (item) => item.categoryId === selectedCategory,
  );

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
    Alert.alert("Delete Item", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setItems((prev) => prev.filter((item) => item.id !== id)),
      },
    ]);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert("Delete Category", `Delete "${name}" and all its items?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
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
        <Text className="mt-4 text-slate-500">Loading menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4 dark:bg-slate-950">
        <Ionicons name="alert-circle-outline" size={48} color={colors.tint} />
        <Text className="mt-4 text-center font-semibold text-slate-900 dark:text-white">
          Unable to Load Menu
        </Text>
        <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Categories Sidebar/TopBar */}
      <View className="border-b border-slate-200 bg-slate-50 py-3 dark:border-slate-800 dark:bg-slate-900">
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              onLongPress={() => handleEditCategoryPress(item.id, item.name)}
              delayLongPress={500}
              className={`rounded-full border px-4 py-2 ${
                selectedCategory === item.id
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className={`font-semibold ${
                  selectedCategory === item.id
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={handleAddCategoryPress}
              className="flex-row items-center rounded-full border border-dashed border-slate-400 px-3 py-2"
            >
              <Ionicons name="add" size={18} color={colors.text} />
              <Text
                style={{ fontSize: responsive.baseFontSize - 2 }}
                className="ml-1 text-slate-600 dark:text-slate-400"
              >
                New
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text
              style={{ fontSize: responsive.baseFontSize }}
              className="text-slate-500"
            >
              No items in this category.
            </Text>
            <Button
              label="Add First Item"
              variant="outline"
              className="mt-4"
              onPress={handleAddItemPress}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Image Placeholder */}
            <View className="mr-3 h-16 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <Ionicons name="fast-food" size={24} color="#cbd5e1" />
            </View>

            <View className="flex-1">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="font-semibold text-slate-900 dark:text-white"
              >
                {item.name}
              </Text>
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="text-slate-500 dark:text-slate-400"
              >
                ${item.price.toFixed(2)}
              </Text>
              {/* Display Attributes/Options */}
              {(item.optionGroups || item.ingredients) && (
                <View className="mt-2 gap-1">
                  {item.optionGroups && item.optionGroups.length > 0 && (
                    <Text
                      style={{ fontSize: responsive.baseFontSize - 2 }}
                      className="text-xs text-slate-600 dark:text-slate-400"
                    >
                      Options: {item.optionGroups.length}
                    </Text>
                  )}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <Text
                      style={{ fontSize: responsive.baseFontSize - 2 }}
                      className="text-xs text-slate-600 dark:text-slate-400"
                    >
                      Add-ons: {item.ingredients.length}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <View className="flex-row gap-1">
              <TouchableOpacity
                onPress={() => handleEditItemPress(item)}
                className="p-2"
              >
                <Ionicons name="pencil" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id, item.name)}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Action Buttons */}
      <View className="absolute bottom-6 right-6 items-end gap-4">
        {/* AI Scanner FAB */}
        <TouchableOpacity
          onPress={onScanPress}
          className="flex-row items-center rounded-full bg-indigo-600 px-4 py-3 shadow-lg"
        >
          <Ionicons name="scan" size={20} color="white" />
          <Text className="ml-2 font-semibold text-white">AI Scan</Text>
        </TouchableOpacity>

        {/* Add Item FAB */}
        {selectedCategory && (
          <TouchableOpacity
            onPress={handleAddItemPress}
            className="h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
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
