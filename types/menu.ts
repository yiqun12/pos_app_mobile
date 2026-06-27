export type OptionChoice = {
  id: string;
  name: string;
  priceAdjustment?: number; // Additional cost for this option
};

export type OptionGroup = {
  id: string;
  name: string;
  type: "single" | "multi"; // single-select or multi-select
  required: boolean;
  choices: OptionChoice[];
};

export type Ingredient = {
  id: string;
  name: string;
  priceAdjustment?: number; // Additional cost for this ingredient
};

export type WebAttributeVariation = {
  type?: string;
  price?: number | string;
};

export type WebAttributeGroup = {
  isSingleSelected?: boolean;
  variations?: WebAttributeVariation[];
};

export type WebAttributesArr = Record<string, WebAttributeGroup>;

export type MenuAvailability = boolean | string | string[];

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  rawName?: string;
  nameCN?: string;
  categoryName?: string;
  categoryNameCN?: string;
  price: number;
  image?: string;
  imageUrl?: string;
  availability?: MenuAvailability;
  attributesArr?: WebAttributesArr; // Raw Web POS attributes, kept for compatible cart writes
  optionGroups?: OptionGroup[]; // Customizable options
  ingredients?: Ingredient[]; // Optional add-ons/ingredients
};

export type MenuCategory = {
  id: string;
  name: string;
  nameCN?: string;
};

export type Menu = {
  categories: MenuCategory[];
  items: MenuItem[];
};

/**
 * Global customization option that applies to all menu items
 * Format from Firebase: { type: "外卖", price: 0, typeCategory: "要求添加" }
 */
export type GlobalCustomization = {
  id: string;
  type: string; // Display name (e.g., "外卖", "加酱料", "不要葱")
  price: number; // Price adjustment
  typeCategory: "要求添加" | "要求减少"; // Category: "Add" or "Remove"
};

/**
 * Grouped global customizations by category
 */
export type GlobalCustomizationGroup = {
  category: "要求添加" | "要求减少";
  categoryLabel: string; // Display label (e.g., "Add Requests", "Remove Requests")
  items: GlobalCustomization[];
};
