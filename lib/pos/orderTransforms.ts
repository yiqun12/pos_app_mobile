import type {
  OrderItem,
  SelectedGlobalCustomization,
  SelectedOption,
} from "../../components/seats/types";
import type { GlobalCustomization, MenuItem } from "../../types/menu";

type WebAttributesArr = NonNullable<MenuItem["attributesArr"]>;

export type WebCartItem = {
  id: string;
  name: string;
  subtotal: string;
  image?: string;
  quantity: number;
  attributeSelected: Record<string, string | string[]>;
  attributesArr?: MenuItem["attributesArr"];
  count: number | string;
  itemTotalPrice: number;
  CHI?: string;
  availability?: MenuItem["availability"];
  selectedOptions?: SelectedOption[];
  selectedIngredients?: OrderItem["selectedIngredients"];
  selectedGlobalCustomizations?: SelectedGlobalCustomization[];
};

export type OrderTotalsInput = {
  itemsSubtotal: number;
  taxRate: number;
  discount?: number;
  serviceFee?: number;
  tip?: number;
  taxExempt?: boolean;
};

export type OrderTotals = {
  subtotal: number;
  discount: number;
  taxableSubtotal: number;
  tax: number;
  serviceFee: number;
  tip: number;
  total: number;
};

export type WebOrderTotalsInput = {
  itemsSubtotal: number;
  taxRate: number;
  discount?: number;
  serviceFee?: number;
  surcharge?: number;
  tip?: number;
  taxExempt?: boolean;
};

export type WebOrderTotals = OrderTotals & {
  taxExemptDiscount: number;
  totalDiscount: number;
  surcharge: number;
};

export type TargetTotalAdjustmentInput<T extends Record<string, any>> = {
  products: T[];
  targetSubtotal: number;
  taxRate: number;
  taxExempt?: boolean;
  count?: number;
};

export type TargetTotalAdjustmentResult<T extends Record<string, any>> = {
  products: Array<T | WebCartItem>;
  manualAdjustment: number;
  discount: number;
  surcharge: number;
  taxExemptDiscount: number;
};

export type CashPaymentBreakdownInput = {
  amountDue: number;
  cashReceived: number;
  gratuity?: number;
};

export type CashGratuityPercentInput = {
  subtotal: number;
  percent: number;
};

export type CashPaymentBreakdown = {
  basePayment: number;
  gratuity: number;
  paymentTotal: number;
  changeDue: number;
  isFullPayment: boolean;
};

export type EditableCartSelections = {
  selectedOptions: SelectedOption[];
  selectedIngredients: NonNullable<OrderItem["selectedIngredients"]>;
  selectedGlobalCustomizations: SelectedGlobalCustomization[];
};

export type CartItemToEditableSelectionsInput = {
  product: Record<string, any>;
  menuItem?: MenuItem;
  globalCustomizations?: GlobalCustomization[];
};

export type BuildEditedWebCartItemInput = EditableCartSelections & {
  product: Record<string, any>;
  menuItem?: MenuItem;
};

export type CustomPriceReviseInput<T extends Record<string, any>> = {
  product: T;
  reason: string;
  amount: number;
  increase: boolean;
};

const CUSTOMIZED_OPTION_GROUP = "Customized Option";

export function cleanProductData<T extends Record<string, any>>(products: T[] | null | undefined): T[] {
  if (!Array.isArray(products)) return [];

  return products.map((product) => {
    const cleanedProduct: T = { ...product };
    const mutableProduct = cleanedProduct as Record<string, any>;
    if (mutableProduct.attributeSelected) {
      mutableProduct.attributeSelected = { ...mutableProduct.attributeSelected };
    }

    const tableItems = mutableProduct.attributeSelected?.["开台商品"];
    if (Array.isArray(tableItems)) {
      mutableProduct.attributeSelected["开台商品"] = tableItems
        .map((item: unknown) => {
          if (typeof item !== "string" || !item.startsWith("开台时间-")) return item;
          const parts = item.split("-");
          const timestamp = parseInt(parts[parts.length - 1], 10);
          if (!Number.isFinite(timestamp)) return item;
          const date = new Date(timestamp);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `Start Time: ${hours}:${minutes}`;
        })
        .filter((item: unknown, index: number, arr: unknown[]) => arr.indexOf(item) === index);
    }

    if (mutableProduct.isNew) mutableProduct.isNew = false;
    return cleanedProduct;
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeSelectionValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function cloneAttributesArr(attributesArr?: MenuItem["attributesArr"]): WebAttributesArr {
  const cloned: WebAttributesArr = {};
  Object.entries(attributesArr ?? {}).forEach(([groupName, group]) => {
    cloned[groupName] = {
      ...group,
      variations: (group.variations ?? []).map((variation) => ({ ...variation })),
    };
  });
  return cloned;
}

function mergeAttributesArr(
  baseAttributes?: MenuItem["attributesArr"],
  overrideAttributes?: MenuItem["attributesArr"]
): WebAttributesArr {
  return {
    ...cloneAttributesArr(baseAttributes),
    ...cloneAttributesArr(overrideAttributes),
  };
}

function selectedOptionsToAttributesArr(
  selectedOptions: SelectedOption[] | undefined,
  attributesArr?: MenuItem["attributesArr"]
): WebAttributesArr {
  const nextAttributes = cloneAttributesArr(attributesArr);

  (selectedOptions ?? []).forEach((group) => {
    if (!nextAttributes[group.groupName]) {
      nextAttributes[group.groupName] = {
        isSingleSelected: false,
        variations: [],
      };
    }

    const variations = nextAttributes[group.groupName]?.variations ?? [];
    group.selectedChoices.forEach((choice) => {
      const existingIndex = variations.findIndex((variation) => variation.type === choice.name);
      const nextVariation = {
        type: choice.name,
        price: choice.priceAdjustment ?? 0,
      };
      if (existingIndex >= 0) variations[existingIndex] = nextVariation;
      else variations.push(nextVariation);
    });
    nextAttributes[group.groupName] = {
      ...nextAttributes[group.groupName],
      variations,
    };
  });

  return nextAttributes;
}

function createWebAttributeChoiceId(attributeName: string, variationType: string): string {
  return `${attributeName}:${variationType}`;
}

function sumSelectionAdjustments({
  selectedOptions,
  selectedIngredients,
  selectedGlobalCustomizations,
}: EditableCartSelections): number {
  const optionTotal = selectedOptions.reduce(
    (sum, group) =>
      sum + group.selectedChoices.reduce(
        (choiceSum, choice) => choiceSum + (choice.priceAdjustment ?? 0),
        0
      ),
    0
  );
  const ingredientTotal = selectedIngredients.reduce(
    (sum, ingredient) => sum + (ingredient.priceAdjustment ?? 0),
    0
  );
  const globalTotal = selectedGlobalCustomizations.reduce(
    (sum, customization) => sum + (customization.price ?? 0),
    0
  );
  return optionTotal + ingredientTotal + globalTotal;
}

export const SURCHARGE_ITEM_ID = "SURCHARGE_ITEM";

export function getCartProductKey(product: Pick<WebCartItem, "id" | "count"> | Record<string, any>): string {
  return String(product.count ?? product.id);
}

export function isSurchargeCartItem(item: Pick<WebCartItem, "id" | "name"> | Record<string, any>): boolean {
  return item.id === SURCHARGE_ITEM_ID;
}

export function createSurchargeCartItem(amount: number, count: number | string = Date.now()): WebCartItem {
  const value = roundMoney(Math.max(0, amount));
  return {
    id: SURCHARGE_ITEM_ID,
    name: "Surcharge!",
    CHI: "加价！",
    image: "",
    subtotal: value.toFixed(2),
    itemTotalPrice: value,
    quantity: 1,
    availability: true,
    attributesArr: {},
    attributeSelected: {},
    count,
  };
}

export function removeSurchargeCartItems<T extends Record<string, any>>(products: T[]): T[] {
  return products.filter((product) => !isSurchargeCartItem(product));
}

export function getSurchargeTotal(products: Array<Record<string, any>>): number {
  return roundMoney(
    products
      .filter(isSurchargeCartItem)
      .reduce((sum, product) => sum + parseMoney(product.itemTotalPrice ?? product.subtotal), 0)
  );
}

export function getProductsSubtotal(products: Array<Record<string, any>>, {
  includeSurcharge = true,
}: { includeSurcharge?: boolean } = {}): number {
  return roundMoney(
    products
      .filter((product) => includeSurcharge || !isSurchargeCartItem(product))
      .reduce((sum, product) => sum + parseMoney(product.itemTotalPrice ?? product.subtotal), 0)
  );
}

export function applyTargetTotalAdjustment<T extends Record<string, any>>({
  products,
  targetSubtotal,
  taxRate,
  taxExempt = false,
  count = Date.now(),
}: TargetTotalAdjustmentInput<T>): TargetTotalAdjustmentResult<T> {
  const normalProducts = removeSurchargeCartItems(products);
  const originalSubtotal = getProductsSubtotal(normalProducts, { includeSurcharge: false });
  const target = roundMoney(Math.max(0, targetSubtotal));
  const difference = roundMoney(target - originalSubtotal);
  const taxableBaseForExemption = difference > 0 ? target : originalSubtotal;
  const taxExemptDiscount = taxExempt ? roundMoney(taxableBaseForExemption * (taxRate / 100)) : 0;

  if (difference > 0) {
    return {
      products: [...normalProducts, createSurchargeCartItem(difference, count)],
      manualAdjustment: 0,
      discount: taxExemptDiscount,
      surcharge: difference,
      taxExemptDiscount,
    };
  }

  const discount = roundMoney(Math.abs(Math.min(0, difference)) + taxExemptDiscount);
  return {
    products: normalProducts,
    manualAdjustment: difference,
    discount,
    surcharge: 0,
    taxExemptDiscount,
  };
}

export function buildCashPaymentBreakdown({
  amountDue,
  cashReceived,
  gratuity = 0,
}: CashPaymentBreakdownInput): CashPaymentBreakdown {
  const due = roundMoney(Math.max(0, amountDue));
  const received = roundMoney(Math.max(0, cashReceived));
  const basePayment = roundMoney(Math.min(due, received));
  const appliedGratuity = basePayment >= due
    ? roundMoney(Math.max(0, gratuity))
    : 0;
  const paymentTotal = roundMoney(basePayment + appliedGratuity);

  return {
    basePayment,
    gratuity: appliedGratuity,
    paymentTotal,
    changeDue: roundMoney(Math.max(0, received - paymentTotal)),
    isFullPayment: basePayment >= due && due > 0,
  };
}

export function calculateCashGratuityFromPercent({
  subtotal,
  percent,
}: CashGratuityPercentInput): number {
  return roundMoney(Math.max(0, subtotal) * (Math.max(0, percent) / 100));
}

export function applyCustomPriceReviseToProduct<T extends Record<string, any>>({
  product,
  reason,
  amount,
  increase,
}: CustomPriceReviseInput<T>): T {
  const name = reason.trim() || "改价";
  const value = roundMoney(Math.abs(amount));
  const priceAdjustment = increase ? value : -value;
  const quantity = typeof product.quantity === "number" && product.quantity > 0 ? product.quantity : 1;
  const baseSubtotal = parseMoney(product.subtotal);
  const currentSelected = product.attributeSelected && typeof product.attributeSelected === "object"
    ? { ...product.attributeSelected }
    : {};
  const nextAttributes = cloneAttributesArr(product.attributesArr);

  const existingGroup = nextAttributes?.[CUSTOMIZED_OPTION_GROUP] ?? {
    isSingleSelected: false,
    variations: [],
  };
  const existingVariations = existingGroup.variations ?? [];
  const existingIndex = existingVariations.findIndex((variation) => variation.type === name);
  const nextVariation = { type: name, price: priceAdjustment };
  const nextVariations = [...existingVariations];
  if (existingIndex >= 0) nextVariations[existingIndex] = nextVariation;
  else nextVariations.push(nextVariation);

  const existingSelected = normalizeSelectionValue(currentSelected[CUSTOMIZED_OPTION_GROUP]);
  const nextSelected = existingSelected.includes(name)
    ? existingSelected
    : [...existingSelected, name].sort();
  const optionAdjustment = nextSelected.reduce((sum, selectedName) => {
    const variation = nextVariations.find((item) => item.type === selectedName);
    return sum + parseMoney(variation?.price);
  }, 0);
  const nextUnitPrice = roundMoney(baseSubtotal + optionAdjustment);
  if (nextUnitPrice < 0) {
    throw new Error("custom price revise would make product total negative");
  }

  return {
    ...product,
    attributesArr: {
      ...nextAttributes,
      [CUSTOMIZED_OPTION_GROUP]: {
        ...existingGroup,
        isSingleSelected: false,
        variations: nextVariations,
      },
    },
    attributeSelected: {
      ...currentSelected,
      [CUSTOMIZED_OPTION_GROUP]: nextSelected,
    },
    itemTotalPrice: roundMoney(nextUnitPrice * quantity),
  };
}

export function cartItemToEditableSelections({
  product,
  menuItem,
  globalCustomizations = [],
}: CartItemToEditableSelectionsInput): EditableCartSelections {
  const existingOptions = Array.isArray(product.selectedOptions)
    ? product.selectedOptions as SelectedOption[]
    : [];
  const existingIngredients = Array.isArray(product.selectedIngredients)
    ? product.selectedIngredients as NonNullable<OrderItem["selectedIngredients"]>
    : [];
  const existingGlobals = Array.isArray(product.selectedGlobalCustomizations)
    ? product.selectedGlobalCustomizations as SelectedGlobalCustomization[]
    : [];

  if (existingOptions.length > 0 || existingIngredients.length > 0 || existingGlobals.length > 0) {
    return {
      selectedOptions: existingOptions,
      selectedIngredients: existingIngredients,
      selectedGlobalCustomizations: existingGlobals,
    };
  }

  const rawSelected = product.attributeSelected && typeof product.attributeSelected === "object"
    ? product.attributeSelected as Record<string, unknown>
    : {};
  const productAttributes = product.attributesArr && typeof product.attributesArr === "object"
    ? product.attributesArr as MenuItem["attributesArr"]
    : undefined;
  const effectiveAttributes = mergeAttributesArr(menuItem?.attributesArr, productAttributes);

  const optionGroupSelections = (menuItem?.optionGroups ?? [])
    .map((group) => {
      const selectedNames = normalizeSelectionValue(rawSelected[group.name] ?? rawSelected[group.id]);
      const selectedChoices = group.choices.filter((choice) => selectedNames.includes(choice.name));
      return {
        groupId: group.id,
        groupName: group.name,
        selectedChoices,
      };
    })
    .filter((group) => group.selectedChoices.length > 0);
  const optionGroupNames = new Set((menuItem?.optionGroups ?? []).map((group) => group.name));
  const webAttributeSelections = Object.entries(effectiveAttributes ?? {})
    .filter(([attributeName]) => !optionGroupNames.has(attributeName))
    .map(([attributeName, attributeDetails]) => {
      const selectedNames = normalizeSelectionValue(rawSelected[attributeName]);
      const selectedChoices = (attributeDetails.variations ?? [])
        .filter((variation) => typeof variation.type === "string" && selectedNames.includes(variation.type))
        .map((variation) => ({
          id: createWebAttributeChoiceId(attributeName, variation.type ?? ""),
          name: variation.type ?? "",
          priceAdjustment: parseMoney(variation.price),
        }));
      return {
        groupId: attributeName,
        groupName: attributeName,
        selectedChoices,
      };
    })
    .filter((group) => group.selectedChoices.length > 0);

  const selectedGlobalCustomizations = globalCustomizations.filter((customization) =>
    normalizeSelectionValue(rawSelected[customization.typeCategory]).includes(customization.type)
  ).map((customization) => ({
    id: customization.id,
    type: customization.type,
    price: customization.price,
    typeCategory: customization.typeCategory,
  }));

  return {
    selectedOptions: [...optionGroupSelections, ...webAttributeSelections],
    selectedIngredients: [],
    selectedGlobalCustomizations,
  };
}

export function buildEditedWebCartItem({
  product,
  menuItem,
  selectedOptions,
  selectedIngredients,
  selectedGlobalCustomizations,
}: BuildEditedWebCartItemInput): WebCartItem {
  const quantity = typeof product.quantity === "number" ? product.quantity : 1;
  const basePrice = parseMoney(menuItem?.price ?? product.subtotal);
  const unitPrice = roundMoney(
    basePrice + sumSelectionAdjustments({
      selectedOptions,
      selectedIngredients,
      selectedGlobalCustomizations,
    })
  );
  const orderItem: OrderItem = {
    id: String(product.count ?? product.id ?? Date.now()),
    menuItemId: menuItem?.id ?? product.id,
    name: menuItem?.name ?? product.name ?? "Untitled",
    rawName: menuItem?.rawName ?? product.name,
    nameCN: menuItem?.nameCN ?? product.CHI,
    price: unitPrice,
    quantity,
    count: product.count,
    imageUrl: menuItem?.imageUrl ?? product.image,
    attributesArr: mergeAttributesArr(menuItem?.attributesArr, product.attributesArr),
    selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
    selectedIngredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
    selectedGlobalCustomizations: selectedGlobalCustomizations.length > 0
      ? selectedGlobalCustomizations
      : undefined,
  };
  return {
    ...product,
    ...createWebCartItem({
      orderItem,
      menuItem,
      count: product.count,
    }),
    availability: product.availability,
    selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
    selectedIngredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
    selectedGlobalCustomizations: selectedGlobalCustomizations.length > 0
      ? selectedGlobalCustomizations
      : undefined,
  };
}

function stableAttributeSignature(value: unknown): string {
  if (!value || typeof value !== "object") return "{}";
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return JSON.stringify(
    entries.map(([key, item]) => [
      key,
      Array.isArray(item) ? [...item].sort() : item,
    ])
  );
}

export function selectedOptionsToWebAttributes(
  orderItem: Pick<
    OrderItem,
    "selectedOptions" | "selectedGlobalCustomizations"
  >,
  attributesArr?: MenuItem["attributesArr"]
): Record<string, string | string[]> {
  const selected: Record<string, string | string[]> = {};

  (orderItem.selectedOptions ?? []).forEach((group) => {
    const choices = group.selectedChoices.map((choice) => choice.name);
    const isSingle = attributesArr?.[group.groupName]?.isSingleSelected ?? choices.length === 1;
    if (choices.length === 1 && isSingle) selected[group.groupName] = choices[0];
    else if (choices.length === 1) selected[group.groupName] = choices;
    else if (choices.length > 1) selected[group.groupName] = choices.sort();
  });

  (orderItem.selectedGlobalCustomizations ?? []).forEach((customization) => {
    const existing = selected[customization.typeCategory];
    const next = Array.isArray(existing)
      ? existing
      : typeof existing === "string"
        ? [existing]
        : [];
    selected[customization.typeCategory] = [...next, customization.type].sort();
  });

  return selected;
}

export function createWebCartItem({
  orderItem,
  menuItem,
  count = Date.now(),
}: {
  orderItem: OrderItem;
  menuItem?: MenuItem;
  count?: number | string;
}): WebCartItem {
  const attributesArr = selectedOptionsToAttributesArr(
    orderItem.selectedOptions,
    menuItem?.attributesArr ?? orderItem.attributesArr
  );
  const attributeSelected =
    orderItem.attributeSelected ??
    selectedOptionsToWebAttributes(
      orderItem,
      attributesArr
    );
  const rawName = menuItem?.rawName ?? orderItem.rawName ?? orderItem.name;
  const nameCN = menuItem?.nameCN ?? orderItem.nameCN;
  const itemCount = orderItem.count ?? count;
  const subtotal = roundMoney(orderItem.price);

  return {
    id: menuItem?.id ?? orderItem.menuItemId ?? orderItem.id,
    name: rawName,
    subtotal: subtotal.toFixed(2),
    image: menuItem?.imageUrl ?? orderItem.imageUrl,
    quantity: orderItem.quantity,
    attributeSelected,
    attributesArr,
    count: itemCount,
    itemTotalPrice: roundMoney(subtotal * orderItem.quantity),
    CHI: nameCN,
    selectedOptions: orderItem.selectedOptions,
    selectedIngredients: orderItem.selectedIngredients,
    selectedGlobalCustomizations: orderItem.selectedGlobalCustomizations,
  };
}

export function cartItemSignature(item: Pick<WebCartItem, "id" | "attributeSelected">): string {
  return `${item.id}:${stableAttributeSignature(item.attributeSelected)}`;
}

export function calculateOrderTotals(input: OrderTotalsInput): OrderTotals {
  const subtotal = roundMoney(input.itemsSubtotal);
  const discount = roundMoney(Math.max(0, input.discount ?? 0));
  const taxableSubtotal = roundMoney(Math.max(0, subtotal - discount));
  const tax = input.taxExempt
    ? 0
    : roundMoney(taxableSubtotal * (input.taxRate / 100));
  const serviceFee = roundMoney(Math.max(0, input.serviceFee ?? 0));
  const tip = roundMoney(Math.max(0, input.tip ?? 0));

  return {
    subtotal,
    discount,
    taxableSubtotal,
    tax,
    serviceFee,
    tip,
    total: roundMoney(taxableSubtotal + tax + serviceFee + tip),
  };
}

export function calculateWebOrderTotals(input: WebOrderTotalsInput): WebOrderTotals {
  const subtotal = roundMoney(input.itemsSubtotal);
  const surcharge = roundMoney(Math.max(0, input.surcharge ?? 0));
  const discount = roundMoney(Math.max(0, input.discount ?? 0));
  const taxableSubtotal = roundMoney(subtotal + surcharge);
  const tax = roundMoney(taxableSubtotal * (input.taxRate / 100));
  const taxExemptDiscount = input.taxExempt ? tax : 0;
  const totalDiscount = roundMoney(discount + taxExemptDiscount);
  const serviceFee = roundMoney(Math.max(0, input.serviceFee ?? 0));
  const tip = roundMoney(Math.max(0, input.tip ?? 0));

  return {
    subtotal,
    discount,
    taxableSubtotal,
    tax,
    serviceFee,
    tip,
    taxExemptDiscount,
    totalDiscount,
    surcharge,
    total: roundMoney(taxableSubtotal + tax + serviceFee + tip - totalDiscount),
  };
}

function clonePartialQuantity<T extends { quantity?: number; itemTotalPrice?: number }>(
  item: T,
  quantity: number
): T {
  const originalQuantity = item.quantity ?? 1;
  const unitTotal = originalQuantity > 0 ? (item.itemTotalPrice ?? 0) / originalQuantity : 0;
  return {
    ...item,
    quantity,
    itemTotalPrice: roundMoney(unitTotal * quantity),
  };
}

export function diffKitchenChanges<T extends { count?: number; quantity?: number; itemTotalPrice?: number }>(
  previous: T[],
  next: T[]
): { added: T[]; deleted: T[] } {
  const previousByCount = new Map(previous.map((item) => [item.count, item]));
  const nextByCount = new Map(next.map((item) => [item.count, item]));
  const added: T[] = [];
  const deleted: T[] = [];

  next.forEach((nextItem) => {
    const previousItem = previousByCount.get(nextItem.count);
    if (!previousItem) {
      added.push(nextItem);
      return;
    }
    const quantityDelta = (nextItem.quantity ?? 1) - (previousItem.quantity ?? 1);
    if (quantityDelta > 0) added.push(clonePartialQuantity(nextItem, quantityDelta));
    if (quantityDelta < 0) deleted.push(clonePartialQuantity(previousItem, Math.abs(quantityDelta)));
  });

  previous.forEach((previousItem) => {
    if (!nextByCount.has(previousItem.count)) deleted.push(previousItem);
  });

  return { added, deleted };
}
