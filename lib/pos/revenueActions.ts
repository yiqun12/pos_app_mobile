import {
  buildWebReceiptPrintPayload,
  type ReceiptPreviewOrder,
  type ReceiptReplayType,
} from "@/lib/pos/receiptPreviewCore";

export type { ReceiptReplayType } from "@/lib/pos/receiptPreviewCore";

type RevenueActionOrder = ReceiptPreviewOrder & {
  channel?: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toCents(value: number) {
  return Math.round(roundMoney(value) * 100);
}

function parseMetadataNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function resolveTableNumber(order: RevenueActionOrder) {
  if (order.tableNum) return order.tableNum;
  const guest = order.guest ?? "";
  const tableMatch = guest.match(/table\s+(.+)/i);
  return tableMatch?.[1]?.trim() || guest || "";
}

function parseReceiptData(receiptData?: string) {
  if (!receiptData) return [];
  try {
    const parsed = JSON.parse(receiptData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Mirrors eatifyPos Account_admin handleConfirm — add cash gratuity after payment. */
export function buildCashTipsPatch(
  order: RevenueActionOrder,
  extraTip: number
) {
  const currentTips = roundMoney(
    parseMetadataNumber(order.metadata?.tips, order.gratuity ?? 0)
  );
  const currentTotal = roundMoney(
    parseMetadataNumber(order.metadata?.total, order.total ?? order.amount ?? 0)
  );
  const extra = roundMoney(Math.max(0, extraTip));
  const tipsUpdated = roundMoney(currentTips + extra);
  const totalUpdated = roundMoney(currentTotal - currentTips + tipsUpdated);

  return {
    amount: toCents(totalUpdated),
    amount_received: toCents(totalUpdated),
    "metadata.total": totalUpdated,
    "metadata.tips": tipsUpdated,
  };
}

export function buildBankReceiptPayload(
  order: RevenueActionOrder,
  date: string
) {
  return {
    date,
    data: parseReceiptData(order.receiptData),
    receiptData: order.receiptData ?? "[]",
    selectedTable: resolveTableNumber(order),
    tableNum: resolveTableNumber(order),
    orderId: order.id,
    total: roundMoney(order.total ?? order.amount ?? 0),
    metadata: order.metadata ?? {},
    powerBy: order.channel ?? "",
  };
}

export function buildReceiptReplayPayload(
  order: RevenueActionOrder,
  type: ReceiptReplayType,
  date: string
) {
  return buildWebReceiptPrintPayload(order, type, date);
}
