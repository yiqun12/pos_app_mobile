import type { OrderItem } from "../../components/seats/types";
import type { MenuItem } from "../../types/menu";

export type WebCartItem = {
  id: string;
  name: string;
  subtotal: string;
  image?: string;
  quantity: number;
  attributeSelected: Record<string, string | string[]>;
  attributesArr?: MenuItem["attributesArr"];
  count: number;
  itemTotalPrice: number;
  CHI?: string;
  availability?: boolean;
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

export const SURCHARGE_ITEM_ID = "SURCHARGE_ITEM";

export function isSurchargeCartItem(item: Pick<WebCartItem, "id" | "name"> | Record<string, any>): boolean {
  return item.id === SURCHARGE_ITEM_ID;
}

export function createSurchargeCartItem(amount: number, count = Date.now()): WebCartItem {
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
  const availableExtra = roundMoney(Math.max(0, received - basePayment));
  const appliedGratuity = basePayment >= due
    ? roundMoney(Math.min(Math.max(0, gratuity), availableExtra))
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
  count?: number;
}): WebCartItem {
  const attributeSelected =
    orderItem.attributeSelected ??
    selectedOptionsToWebAttributes(
      orderItem,
      menuItem?.attributesArr ?? orderItem.attributesArr
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
    attributesArr: menuItem?.attributesArr ?? orderItem.attributesArr,
    count: itemCount,
    itemTotalPrice: roundMoney(subtotal * orderItem.quantity),
    CHI: nameCN,
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
