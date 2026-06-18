import type { TableTimingTimer } from "@/lib/pos/tableTiming";

type CartProduct = Record<string, any>;

function productMergeKey(product: CartProduct): string {
  return `${product.id}-${JSON.stringify(product.attributeSelected ?? {})}`;
}

function readQuantity(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildChangeDeskProducts({
  sourceProducts,
  targetProducts,
}: {
  sourceProducts: CartProduct[];
  targetProducts: CartProduct[];
}): CartProduct[] {
  const grouped = new Map<string, CartProduct>();

  [...sourceProducts, ...targetProducts].forEach((product) => {
    const key = productMergeKey(product);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...product });
      return;
    }

    grouped.set(key, {
      ...existing,
      quantity: readQuantity(existing.quantity) + readQuantity(product.quantity),
      itemTotalPrice: roundMoney(readMoney(existing.itemTotalPrice) + readMoney(product.itemTotalPrice)),
    });
  });

  return Array.from(grouped.values());
}

export function parseTableProducts(raw: unknown): CartProduct[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildMigratedTableTimingTimer(
  timer: TableTimingTimer,
  targetTableName: string
): TableTimingTimer {
  return {
    ...timer,
    tableName: targetTableName,
  };
}
