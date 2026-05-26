
import { useStore } from "@/hooks/firestore/useStore";
import { useMenu as useFirestoreMenu } from "@/hooks/firestore/useMenu";
import { MOCK_GLOBAL_MODIFICATIONS, MOCK_MENU } from "@/lib/firestore/mocks";
import { GlobalCustomization, GlobalCustomizationGroup, MenuCategory, MenuItem } from "@/types/menu";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  const [globalCustomizations, setGlobalCustomizationsState] = useState<GlobalCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: firestoreMenu, loading: fsLoading, error: fsError } = useFirestoreMenu();
  const { data: store } = useStore();

  useEffect(() => {
    if (firestoreMenu && (firestoreMenu.categories.length > 0 || firestoreMenu.items.length > 0)) {
      setCategories(firestoreMenu.categories);
      setItems(firestoreMenu.items);
    } else if (fsError && __DEV__) {
      setCategories(MOCK_MENU.categories);
      setItems(MOCK_MENU.items);
    }
  }, [firestoreMenu, fsError]);

  useEffect(() => {
    if (store?.globalModifications && store.globalModifications.length > 0) {
      setGlobalCustomizationsState(
        store.globalModifications.map((m) => ({
          id: m.id,
          type: m.type,
          price: m.price,
          typeCategory: m.typeCategory,
        }))
      );
    } else if (fsError && __DEV__) {
      setGlobalCustomizationsState(
        MOCK_GLOBAL_MODIFICATIONS.map((m) => ({
          id: m.id,
          type: m.type,
          price: m.price,
          typeCategory: m.typeCategory,
        }))
      );
    }
  }, [store, fsError]);

  useEffect(() => {
    setLoading(fsLoading);
    setError(fsError ? fsError.message : null);
  }, [fsLoading, fsError]);

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
