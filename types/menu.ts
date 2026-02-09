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

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  optionGroups?: OptionGroup[]; // Customizable options
  ingredients?: Ingredient[]; // Optional add-ons/ingredients
};

export type MenuCategory = {
  id: string;
  name: string;
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
