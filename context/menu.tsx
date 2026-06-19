
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useStore } from "@/hooks/firestore/useStore";
import { useMenu as useFirestoreMenu } from "@/hooks/firestore/useMenu";
import { fetchStore } from "@/lib/firestore/repositories/store";
import {
  updateGlobalModifications as persistGlobalModifications,
  updateMenu as persistMenu,
} from "@/lib/firestore/repositories/menu";
import { MOCK_GLOBAL_MODIFICATIONS, MOCK_MENU } from "@/lib/firestore/mocks";
import {
  addCategoryToMenu,
  addItemToMenu,
  deleteCategoryFromMenu,
  deleteItemFromMenu,
  makeMenuId,
  mergeScannedRawItemsIntoMenu,
  updateCategoryInMenu,
  updateItemInMenu,
} from "@/lib/pos/menuMutations";
import type { WebMenuItem } from "@/lib/pos/menuTransforms";
import type {
  GlobalCustomization,
  GlobalCustomizationGroup,
  Menu,
  MenuCategory,
  MenuItem,
} from "@/types/menu";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* ---------- Types ---------- */
type CategoryInput = {
  name: string;
  nameCN?: string;
};

interface MenuContextType {
  categories: MenuCategory[];
  items: MenuItem[];
  globalCustomizations: GlobalCustomization[];
  globalCustomizationGroups: GlobalCustomizationGroup[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  addCategory: (category: CategoryInput) => Promise<MenuCategory>;
  updateCategory: (id: string, updates: Partial<CategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<MenuItem, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  mergeScannedItems: (items: Omit<MenuItem, "id">[]) => Promise<void>;
  mergeScannedRawItems: (rawItems: WebMenuItem[]) => Promise<void>;
  setGlobalCustomizations: (customizations: GlobalCustomization[]) => void;
  saveGlobalCustomizations: (customizations: GlobalCustomization[]) => Promise<void>;
  refreshMenuData: () => Promise<void>;
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: firestoreMenu, loading: fsLoading, error: fsError } = useFirestoreMenu();
  const { data: store } = useStore();
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();

  const menu = useMemo<Menu>(
    () => ({ categories, items }),
    [categories, items]
  );

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

  const refreshMenuData = useCallback(async () => {
    if (!user?.uid || !currentStoreId) {
      if (firestoreMenu) {
        setCategories(firestoreMenu.categories);
        setItems(firestoreMenu.items);
      }
      return;
    }

    try {
      setSaveError(null);
      const latestStore = await fetchStore(user.uid, currentStoreId);
      if (!latestStore) return;
      setCategories(latestStore.menu.categories);
      setItems(latestStore.menu.items);
      setGlobalCustomizationsState(
        latestStore.globalModifications.map((m) => ({
          id: m.id,
          type: m.type,
          price: m.price,
          typeCategory: m.typeCategory,
        }))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh menu data.";
      setSaveError(message);
      throw error;
    }
  }, [currentStoreId, firestoreMenu, user?.uid]);

  const commitMenu = useCallback(
    async (nextMenu: Menu, previousMenu: Menu) => {
      if (!user?.uid || !currentStoreId) {
        const message = "No selected store for menu save.";
        setSaveError(message);
        throw new Error(message);
      }

      setSaveError(null);
      setSaving(true);
      setCategories(nextMenu.categories);
      setItems(nextMenu.items);

      try {
        await persistMenu(user.uid, currentStoreId, nextMenu);
      } catch (error) {
        setCategories(previousMenu.categories);
        setItems(previousMenu.items);
        const message =
          error instanceof Error ? error.message : "Unable to save menu.";
        setSaveError(message);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [currentStoreId, user?.uid]
  );

  const saveGlobalCustomizations = useCallback(
    async (customizations: GlobalCustomization[]) => {
      if (!user?.uid || !currentStoreId) {
        const message = "No selected store for global customization save.";
        setSaveError(message);
        throw new Error(message);
      }

      const previousCustomizations = globalCustomizations;
      setSaveError(null);
      setSaving(true);
      setGlobalCustomizationsState(customizations);

      try {
        await persistGlobalModifications(user.uid, currentStoreId, customizations);
      } catch (error) {
        setGlobalCustomizationsState(previousCustomizations);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to save global customizations.";
        setSaveError(message);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [currentStoreId, globalCustomizations, user?.uid]
  );



  /* ---------- Category Actions ---------- */
  const addCategory = useCallback(
    async ({ name, nameCN }: CategoryInput) => {
      const previousMenu = menu;
      const category = {
        id: makeMenuId("category"),
        name,
        nameCN,
      };
      const nextMenu = addCategoryToMenu(previousMenu, {
        ...category,
      });
      await commitMenu(nextMenu, previousMenu);
      return category;
    },
    [commitMenu, menu]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<CategoryInput>) => {
      const previousMenu = menu;
      const nextMenu = updateCategoryInMenu(previousMenu, id, updates);
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const previousMenu = menu;
      const nextMenu = deleteCategoryFromMenu(previousMenu, id);
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  /* ---------- Item Actions ---------- */
  const addItem = useCallback(
    async (item: Omit<MenuItem, "id">) => {
      const previousMenu = menu;
      const nextMenu = addItemToMenu(previousMenu, {
        ...item,
        id: makeMenuId("item"),
      });
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Omit<MenuItem, "id">>) => {
      const previousMenu = menu;
      const nextMenu = updateItemInMenu(previousMenu, id, updates);
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const previousMenu = menu;
      const nextMenu = deleteItemFromMenu(previousMenu, id);
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  const mergeScannedItems = useCallback(
    async (scannedItems: Omit<MenuItem, "id">[]) => {
      const previousMenu = menu;
      const nextMenu = scannedItems.reduce<Menu>(
        (current, item) =>
          addItemToMenu(current, {
            ...item,
            id: makeMenuId("item"),
          }),
        previousMenu
      );
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  const mergeScannedRawItems = useCallback(
    async (rawItems: WebMenuItem[]) => {
      const previousMenu = menu;
      const nextMenu = mergeScannedRawItemsIntoMenu(previousMenu, rawItems);
      await commitMenu(nextMenu, previousMenu);
    },
    [commitMenu, menu]
  );

  return (
    <MenuContext.Provider
      value={{
        categories,
        items,
        globalCustomizations,
        globalCustomizationGroups,
        loading,
        error,
        saving,
        saveError,
        addCategory,
        updateCategory,
        deleteCategory,
        addItem,
        updateItem,
        deleteItem,
        mergeScannedItems,
        mergeScannedRawItems,
        setGlobalCustomizations,
        saveGlobalCustomizations,
        refreshMenuData,
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
