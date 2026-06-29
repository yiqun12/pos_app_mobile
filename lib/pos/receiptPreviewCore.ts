import type { Store } from "@/lib/firestore/types";
import { formatBankReceiptDisplayDate } from "@/lib/pos/bankReceiptCore";

export type ReceiptReplayType = "MerchantReceipt" | "CustomerReceipt";

export type ReceiptPreviewOrder = {
  id: string;
  guest?: string;
  tableNum?: string;
  receiptData?: string;
  metadata?: Record<string, unknown>;
  total?: number;
  amount?: number;
  dateTime?: string;
  time?: string;
  subtotal?: number;
  tax?: number;
  serviceFee?: number;
  gratuity?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
};

export type WebReceiptPrintPayload = {
  date: string;
  data: Record<string, unknown>[];
  selectedTable: string;
  discount: number;
  service_fee: number;
  total: number;
};

export type ReceiptPreviewLine = {
  quantity: number;
  name: string;
  total: number;
};

export type ReceiptPreviewModel = {
  kind: ReceiptReplayType;
  title: string;
  storeName: string;
  storeNameCN?: string;
  storeAddress?: string;
  storePhone?: string;
  table: string;
  orderId: string;
  dateLabel: string;
  lines: ReceiptPreviewLine[];
  discount: number;
  serviceFee: number;
  tips: number;
  subtotal: number;
  tax: number;
  total: number;
  printPayload: WebReceiptPrintPayload;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function parseMetadataNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseLineNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function resolveTableNumber(order: ReceiptPreviewOrder): string {
  if (order.tableNum) return order.tableNum;
  const guest = order.guest ?? "";
  const tableMatch = guest.match(/table\s+(.+)/i);
  return tableMatch?.[1]?.trim() || guest || "-";
}

function parseReceiptData(receiptData?: string): Record<string, unknown>[] {
  if (!receiptData) return [];
  try {
    const parsed = JSON.parse(receiptData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapReceiptLines(
  rawItems: Record<string, unknown>[],
  fallbackItems?: ReceiptPreviewOrder["items"]
): ReceiptPreviewLine[] {
  if (rawItems.length > 0) {
    return rawItems.map((item) => ({
      quantity: parseLineNumber(item.quantity, 1),
      name: String(item.name ?? item.CHI ?? "Item"),
      total: parseLineNumber(
        item.itemTotalPrice ?? item.subtotal ?? item.price,
        0
      ),
    }));
  }

  return (fallbackItems ?? []).map((item) => ({
    quantity: item.quantity,
    name: item.name,
    total: item.total,
  }));
}

function buildStoreAddress(store: Store): string | undefined {
  const parts = [
    store.address?.physical || store.address?.line1,
    store.address?.state,
    store.address?.zip,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function resolvePreviewStore(store: Store | null | undefined, storeId?: string | null): Store {
  if (store) return store;

  return {
    id: storeId ?? "",
    name: "Store",
    address: { line1: "", physical: "", state: "", zip: "" },
    phone: "",
    taxRate: 0,
    openHours: {},
    seatLayout: { tables: [] },
    menu: { categories: [], items: [] },
    globalModifications: [],
    dailyPayout: false,
  };
}

/** Matches eatifyPos Account_admin MerchantReceipt Firestore payload for PrinterDriver. */
export function buildWebReceiptPrintPayload(
  order: ReceiptPreviewOrder,
  type: ReceiptReplayType,
  date: string
): WebReceiptPrintPayload {
  const tips = roundMoney(
    parseMetadataNumber(order.metadata?.tips, order.gratuity ?? 0)
  );
  const finalPrice = roundMoney(
    parseMetadataNumber(order.metadata?.total, order.total ?? order.amount ?? 0)
  );
  const discount = roundMoney(parseMetadataNumber(order.metadata?.discount, 0));
  const serviceFee = roundMoney(
    parseMetadataNumber(order.metadata?.service_fee, order.serviceFee ?? 0)
  );

  const total =
    type === "MerchantReceipt"
      ? roundMoney(finalPrice - tips)
      : roundMoney(finalPrice);

  return {
    date,
    data: parseReceiptData(order.receiptData),
    selectedTable: resolveTableNumber(order),
    discount,
    service_fee: serviceFee,
    total,
  };
}

export function buildReceiptPreviewModel({
  store,
  order,
  type,
  t,
  date = formatBankReceiptDisplayDate(order.dateTime, order.time),
}: {
  store: Store;
  order: ReceiptPreviewOrder;
  type: ReceiptReplayType;
  t: TranslateFn;
  date?: string;
}): ReceiptPreviewModel {
  const printPayload = buildWebReceiptPrintPayload(order, type, date);
  const tips = roundMoney(
    parseMetadataNumber(order.metadata?.tips, order.gratuity ?? 0)
  );
  const subtotal = roundMoney(
    parseMetadataNumber(order.metadata?.subtotal, order.subtotal ?? 0)
  );
  const tax = roundMoney(parseMetadataNumber(order.metadata?.tax, order.tax ?? 0));

  return {
    kind: type,
    title:
      type === "MerchantReceipt"
        ? t("revenue.receiptPreview.merchantTitle")
        : t("revenue.receiptPreview.customerTitle"),
    storeName: store.name,
    storeNameCN: store.nameCN,
    storeAddress: buildStoreAddress(store),
    storePhone: store.phone,
    table: printPayload.selectedTable,
    orderId: order.id,
    dateLabel: date,
    lines: mapReceiptLines(printPayload.data, order.items),
    discount: printPayload.discount,
    serviceFee: printPayload.service_fee,
    tips,
    subtotal,
    tax,
    total: printPayload.total,
    printPayload,
  };
}
