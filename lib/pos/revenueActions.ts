type RevenueActionOrder = {
  id: string;
  guest?: string;
  tableNum?: string;
  receiptData?: string;
  metadata?: Record<string, unknown>;
  total?: number;
  amount?: number;
  dateTime?: string;
  channel?: string;
};

export type ReceiptReplayType = "MerchantReceipt" | "CustomerReceipt";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return roundMoney(value).toFixed(2);
}

function toCents(value: number) {
  return Math.round(roundMoney(value) * 100);
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

export function buildRevenueAdjustmentPatch(
  order: RevenueActionOrder,
  newTotal: number,
  note: string
) {
  const total = roundMoney(newTotal);
  return {
    amount: toCents(total),
    amount_received: toCents(total),
    metadata: {
      ...(order.metadata ?? {}),
      total: formatMoney(total),
    },
    adminAdjustment: {
      originalTotal: roundMoney(order.total ?? order.amount ?? 0),
      newTotal: total,
      note: note.trim(),
    },
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
  date = new Date().toISOString()
) {
  return {
    ...buildBankReceiptPayload(order, date),
    type,
  };
}
