import type { Ingredient, Menu, MenuCategory, MenuItem, MenuAvailability, OptionGroup } from "../../types/menu";

export const DEFAULT_AVAILABILITY_PERIODS = ["Morning", "Afternoon", "Evening"] as const;
export const DEFAULT_MENU_IMAGE_URL =
  "https://imagedelivery.net/D2Yu9GcuKDLfOUNdrm2hHQ/b686ebae-7ab0-40ec-9383-4c483dace800/public";

export type WebAttributeVariation = {
  type?: string;
  price?: number | string;
};

export type WebAttributeGroup = {
  isSingleSelected?: boolean;
  variations?: WebAttributeVariation[];
};

export type WebAttributesArr = Record<string, WebAttributeGroup>;

export type WebMenuItem = {
  id?: string;
  name?: string;
  CHI?: string;
  price?: number | string;
  subtotal?: number | string;
  category?: string;
  categoryCHI?: string;
  categoryId?: string;
  image?: string;
  imageUrl?: string;
  availability?: MenuAvailability;
  attributesArr?: unknown;
  attributes?: unknown;
  attributes2?: unknown;
};

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMaybeJsonObject<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function parseMaybeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function splitBilingualName(
  displayName: string | undefined,
  rawName?: string,
  nameCN?: string
): { rawName: string; nameCN?: string } {
  if (rawName) return { rawName, nameCN };
  const fallbackName = displayName?.trim() || "Untitled";
  const [english, chinese] = fallbackName.split(/\s+\/\s+/, 2);
  return {
    rawName: english?.trim() || fallbackName,
    nameCN: nameCN ?? (chinese?.trim() || undefined),
  };
}

function normalizeOptionGroups(raw: unknown): OptionGroup[] {
  return parseMaybeArray<OptionGroup>(raw)
    .filter((group) => group && typeof group.name === "string")
    .map((group, index) => ({
      id: group.id ?? group.name ?? `group-${index}`,
      name: group.name,
      type: group.type === "multi" ? "multi" : "single",
      required: Boolean(group.required),
      choices: Array.isArray(group.choices)
        ? group.choices
            .filter((choice) => choice && typeof choice.name === "string")
            .map((choice, choiceIndex) => ({
              id: choice.id ?? `${group.name}-${choice.name || choiceIndex}`,
              name: choice.name,
              priceAdjustment: parseNumber(choice.priceAdjustment, 0),
            }))
        : [],
    }));
}

function normalizeIngredients(raw: unknown): Ingredient[] {
  return parseMaybeArray<Ingredient>(raw)
    .filter((ingredient) => ingredient && typeof ingredient.name === "string")
    .map((ingredient, index) => ({
      id: ingredient.id ?? `ingredient-${index}`,
      name: ingredient.name,
      priceAdjustment: parseNumber(ingredient.priceAdjustment, 0),
    }));
}

export function coerceAvailabilityPeriods(value: MenuAvailability | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((period) => typeof period === "string" && period.trim().length > 0);
  }
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }
  if (value === false) return [];
  return [...DEFAULT_AVAILABILITY_PERIODS];
}

export function transformWebAttributes(raw: unknown): WebAttributesArr {
  return parseMaybeJsonObject<WebAttributesArr>(raw, {});
}

export function transformWebAttributesToOptionGroups(raw: unknown): OptionGroup[] {
  const attributes = transformWebAttributes(raw);
  return Object.entries(attributes).map(([groupName, group]) => ({
    id: groupName,
    name: groupName,
    type: group.isSingleSelected ? "single" : "multi",
    required: false,
    choices: (group.variations ?? []).map((variation) => {
      const choiceName = variation.type ?? "";
      return {
        id: `${groupName}-${choiceName}`,
        name: choiceName,
        priceAdjustment: parseNumber(variation.price, 0),
      };
    }),
  }));
}

export function optionGroupsToWebAttributesArr(optionGroups?: OptionGroup[]): WebAttributesArr {
  const attributesArr: WebAttributesArr = {};
  (optionGroups ?? []).forEach((group) => {
    if (!group.name.trim()) return;
    attributesArr[group.name.trim()] = {
      isSingleSelected: group.type === "single",
      variations: (group.choices ?? []).map((choice) => ({
        type: choice.name,
        price: parseNumber(choice.priceAdjustment, 0),
      })),
    };
  });
  return attributesArr;
}

function resolveCategory(
  categoryId: string,
  categories: MenuCategory[]
): { category: string; categoryCHI?: string } {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return { category: categoryId };
  const split = splitBilingualName(category.name, undefined, category.nameCN);
  return {
    category: split.rawName,
    categoryCHI: split.nameCN,
  };
}

export function serializeMenuForWebKey(menu: Menu): WebMenuItem[] {
  return menu.items.map((item) => {
    const names = splitBilingualName(item.name, item.rawName, item.nameCN);
    const category = resolveCategory(item.categoryId, menu.categories);
    const price = parseNumber(item.price, 0);
    const attributesArr = item.optionGroups && item.optionGroups.length > 0
      ? optionGroupsToWebAttributesArr(item.optionGroups)
      : item.attributesArr ?? {};
    const rawItem: WebMenuItem = {
      id: item.id,
      name: names.rawName,
      CHI: names.nameCN ?? names.rawName,
      price: price.toFixed(2),
      subtotal: price.toFixed(2),
      category: item.categoryName ?? category.category,
      categoryCHI: item.categoryNameCN ?? category.categoryCHI ?? category.category,
      categoryId: item.categoryId,
      image: item.imageUrl || DEFAULT_MENU_IMAGE_URL,
      imageUrl: item.imageUrl || DEFAULT_MENU_IMAGE_URL,
      availability: coerceAvailabilityPeriods(item.availability),
      attributesArr,
    };

    if (item.optionGroups && item.optionGroups.length > 0) {
      rawItem.attributes = item.optionGroups;
    }
    if (item.ingredients && item.ingredients.length > 0) {
      rawItem.attributes2 = item.ingredients;
    }

    return rawItem;
  });
}

export function transformWebMenuItem(raw: WebMenuItem, index: number): MenuItem {
  const rawName = raw.name ?? "Untitled";
  const nameCN = raw.CHI && raw.CHI !== rawName ? raw.CHI : undefined;
  const categoryId = raw.categoryId ?? raw.category ?? "uncategorized";
  const priceSource = raw.price ?? raw.subtotal;
  const attributesArr = transformWebAttributes(raw.attributesArr);
  const rawOptionGroups = normalizeOptionGroups(raw.attributes);
  const optionGroups = rawOptionGroups.length > 0
    ? rawOptionGroups
    : transformWebAttributesToOptionGroups(attributesArr);
  const ingredients = normalizeIngredients(raw.attributes2);

  return {
    id: raw.id ?? `item-${index}`,
    categoryId,
    categoryName: raw.category,
    categoryNameCN: raw.categoryCHI,
    name: nameCN ? `${rawName} / ${nameCN}` : rawName,
    rawName,
    nameCN,
    price: parseNumber(priceSource, 0),
    imageUrl: raw.imageUrl ?? raw.image,
    availability: raw.availability ?? [...DEFAULT_AVAILABILITY_PERIODS],
    attributesArr,
    optionGroups: optionGroups.length > 0 ? optionGroups : undefined,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
  };
}
