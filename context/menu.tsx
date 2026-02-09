
import { GlobalCustomization, GlobalCustomizationGroup, MenuCategory, MenuItem } from "@/types/menu";
import React, { createContext, useContext, useState } from "react";

/* ---------- Fallback Data ---------- */
const FALLBACK_CATEGORIES: MenuCategory[] = [
  { id: "c1", name: "Appetizers" },
  { id: "c2", name: "Main Courses" },
  { id: "c3", name: "Dim Sum" },
  { id: "c4", name: "Beverages" },
];

const FALLBACK_ITEMS: MenuItem[] = [
  { id: "m1", categoryId: "c1", name: "Spring Rolls", price: 5 },
  { id: "m2", categoryId: "c1", name: "Garlic Romaine Lettuce", price: 15 },
  { id: "m3", categoryId: "c2", name: "Sichuan Style Chicken", price: 16.95 },
  { id: "m4", categoryId: "c2", name: "Eel Claypot Crispy Rice", price: 15.8 },
  { id: "m5", categoryId: "c3", name: "Beef Rice Noodle Rolls", price: 6.8 },
  { id: "m6", categoryId: "c3", name: "Pork Dumplings (3pc)", price: 7.2 },
  { id: "m7", categoryId: "c3", name: "Scallop Congee", price: 8.5 },
];

/* ---------- Fallback Global Customizations ---------- */
const FALLBACK_GLOBAL_CUSTOMIZATIONS: GlobalCustomization[] = [
  { id: "gc-1", type: "外卖", price: 0, typeCategory: "要求添加" },
  { id: "gc-2", type: "加酱料", price: 0, typeCategory: "要求添加" },
  { id: "gc-3", type: "加饭", price: 0, typeCategory: "要求添加" },
  { id: "gc-4", type: "加辣", price: 0, typeCategory: "要求添加" },
  { id: "gc-5", type: "加葱", price: 0, typeCategory: "要求添加" },
  { id: "gc-6", type: "堂食", price: 0, typeCategory: "要求减少" },
  { id: "gc-7", type: "不要酱料", price: 0, typeCategory: "要求减少" },
  { id: "gc-8", type: "不要辣", price: 0, typeCategory: "要求减少" },
  { id: "gc-9", type: "不要葱", price: 0, typeCategory: "要求减少" },
];

/* ---------- Types ---------- */
interface MenuContextType {
  categories: MenuCategory[];
  items: MenuItem[];
  globalCustomizations: GlobalCustomization[];
  globalCustomizationGroups: GlobalCustomizationGroup[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addItem: (item: Omit<MenuItem, "id">) => void;
  updateItem: (id: string, updates: Partial<Omit<MenuItem, "id">>) => void;
  deleteItem: (id: string) => void;
  setGlobalCustomizations: (customizations: GlobalCustomization[]) => void;
  scanMenuAI: (imageUri: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

/**
 * Helper function to group global customizations by category
 */
function groupCustomizations(customizations: GlobalCustomization[]): GlobalCustomizationGroup[] {
  const addItems = customizations.filter((c) => c.typeCategory === "要求添加");
  const removeItems = customizations.filter((c) => c.typeCategory === "要求减少");

  const groups: GlobalCustomizationGroup[] = [];

  if (addItems.length > 0) {
    groups.push({
      category: "要求添加",
      categoryLabel: "Add Requests / 要求添加",
      items: addItems,
    });
  }

  if (removeItems.length > 0) {
    groups.push({
      category: "要求减少",
      categoryLabel: "Remove Requests / 要求减少",
      items: removeItems,
    });
  }

  return groups;
}

/* ---------- Provider ---------- */
export function MenuProvider({ children }: { children: React.ReactNode }) {

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [globalCustomizations, setGlobalCustomizationsState] = useState<GlobalCustomization[]>(FALLBACK_GLOBAL_CUSTOMIZATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed grouped customizations
  const globalCustomizationGroups = React.useMemo(
    () => groupCustomizations(globalCustomizations),
    [globalCustomizations]
  );

  const setGlobalCustomizations = (customizations: GlobalCustomization[]) => {
    setGlobalCustomizationsState(customizations);
  };

 

  /* ---------- Category Actions ---------- */
  const addCategory = (name: string) => {
    setCategories((prev) => [
      ...prev,
      { id: Date.now().toString(), name },
    ]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.filter((i) => i.categoryId !== id));
  };

  /* ---------- Item Actions ---------- */
  const addItem = (item: Omit<MenuItem, "id">) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: Date.now().toString() },
    ]);
  };

  const updateItem = (
    id: string,
    updates: Partial<Omit<MenuItem, "id">>
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /* ---------- AI Placeholder ---------- */
  const scanMenuAI = async (imageUri: string) => {
    console.log("Scanning menu from:", imageUri);
    await new Promise((r) => setTimeout(r, 2000));

    const categoryId = Date.now().toString();
    setCategories((prev) => [...prev, { id: categoryId, name: "Scanned Items" }]);

    addItem({
      categoryId,
      name: "AI Verified Special",
      price: 19.99,
      description: "Scanned from physical menu",
    });
  };

  return (
    <MenuContext.Provider
      value={{
        categories,
        items,
        globalCustomizations,
        globalCustomizationGroups,
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        addItem,
        updateItem,
        deleteItem,
        setGlobalCustomizations,
        scanMenuAI,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

/* ---------- Hook ---------- */
export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return ctx;
}