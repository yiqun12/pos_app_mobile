import type { Menu, MenuCategory, MenuItem } from "@/types/menu";
import {
  DEFAULT_AVAILABILITY_PERIODS,
  transformWebMenuItem,
  type WebMenuItem,
} from "@/lib/pos/menuTransforms";

export function makeMenuId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addCategoryToMenu(menu: Menu, category: MenuCategory): Menu {
  return {
    ...menu,
    categories: [category, ...menu.categories],
  };
}

export function updateCategoryInMenu(
  menu: Menu,
  categoryId: string,
  updates: Partial<Omit<MenuCategory, "id">>
): Menu {
  return {
    ...menu,
    categories: menu.categories.map((category) =>
      category.id === categoryId ? { ...category, ...updates } : category
    ),
    items: menu.items.map((item) =>
      item.categoryId === categoryId
        ? {
            ...item,
            categoryName: updates.name ?? item.categoryName,
            categoryNameCN: updates.nameCN ?? item.categoryNameCN,
          }
        : item
    ),
  };
}

export function deleteCategoryFromMenu(menu: Menu, categoryId: string): Menu {
  return {
    ...menu,
    categories: menu.categories.filter((category) => category.id !== categoryId),
    items: menu.items.filter((item) => item.categoryId !== categoryId),
  };
}

export function addItemToMenu(menu: Menu, item: MenuItem): Menu {
  return {
    ...menu,
    items: [item, ...menu.items],
  };
}

export function updateItemInMenu(
  menu: Menu,
  itemId: string,
  updates: Partial<Omit<MenuItem, "id">>
): Menu {
  return {
    ...menu,
    items: menu.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    ),
  };
}

export function deleteItemFromMenu(menu: Menu, itemId: string): Menu {
  return {
    ...menu,
    items: menu.items.filter((item) => item.id !== itemId),
  };
}

function findCategoryForRawItem(
  categories: MenuCategory[],
  rawItem: WebMenuItem
): MenuCategory | undefined {
  const rawCategory = rawItem.category?.trim();
  const rawCategoryCN = rawItem.categoryCHI?.trim();
  const rawCategoryId = rawItem.categoryId?.trim();

  return categories.find((category) => {
    if (rawCategoryId && category.id === rawCategoryId) return true;
    if (rawCategory && category.name === rawCategory) return true;
    if (rawCategoryCN && category.nameCN === rawCategoryCN) return true;
    return false;
  });
}

export function mergeScannedRawItemsIntoMenu(
  menu: Menu,
  rawItems: WebMenuItem[]
): Menu {
  const categories = [...menu.categories];
  const scannedCategoryIds: string[] = [];
  const scannedItems: MenuItem[] = rawItems.map((rawItem, index) => {
    let category = findCategoryForRawItem(categories, rawItem);
    if (!category) {
      category = {
        id: makeMenuId("category"),
        name: rawItem.category?.trim() || "Scanned Items",
        nameCN: rawItem.categoryCHI?.trim() || undefined,
      };
      categories.push(category);
    }
    if (!scannedCategoryIds.includes(category.id)) {
      scannedCategoryIds.push(category.id);
    }

    const item = transformWebMenuItem(
      {
        ...rawItem,
        id: rawItem.id || makeMenuId("item"),
        categoryId: category.id,
        category: category.name,
        categoryCHI: category.nameCN,
      },
      index
    );

    return {
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      categoryNameCN: category.nameCN,
      availability: item.availability ?? [...DEFAULT_AVAILABILITY_PERIODS],
    };
  });
  const scannedCategorySet = new Set(scannedCategoryIds);

  return {
    categories: [
      ...categories.filter((category) => scannedCategorySet.has(category.id)),
      ...categories.filter((category) => !scannedCategorySet.has(category.id)),
    ],
    items: [...scannedItems, ...menu.items],
  };
}
