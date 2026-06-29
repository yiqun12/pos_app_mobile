import type { Store } from "@/lib/firestore/types";

export type BankReceiptOrderContext = {
  id: string;
  guest?: string;
  time?: string;
  channel?: string;
  total?: number;
  amount?: number;
  dateTime?: string;
  latestCharge?: string;
  transactionJson?: Record<string, unknown>;
};

export type BankReceiptCloudResponse = {
  Charge_ID?: string;
  paymentCharge?: Record<string, unknown>;
  [key: string]: unknown;
};

export type BankReceiptPreviewRow = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export type BankReceiptPreviewModel = {
  title: string;
  storeName: string;
  storeAddress?: string;
  rows: BankReceiptPreviewRow[];
  paymentCharge?: Record<string, unknown>;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function isValidStripeChargeId(chargeId?: string): boolean {
  if (!chargeId) return false;
  const normalized = chargeId.trim().toLowerCase();
  return normalized !== "" && normalized !== "ch_none" && normalized.startsWith("ch_");
}

export function canRequestBankReceipt(
  order: Pick<BankReceiptOrderContext, "latestCharge"> | null | undefined,
  stripeStoreAcct?: string
): boolean {
  if (!order) return false;
  return isValidStripeChargeId(order.latestCharge) && Boolean(stripeStoreAcct?.trim());
}

export function formatBankReceiptDisplayDate(
  dateTime?: string,
  fallbackTime?: string
): string {
  if (!dateTime) return fallbackTime ?? "";

  const parts = dateTime.split("-");
  if (parts.length >= 5) {
    const [year, month, day, hour, minute] = parts;
    return `${month}/${day}/${year} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  return dateTime;
}

function parseMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatUsd(value: unknown, assumeCents = false): string | null {
  const parsed = parseMoney(value);
  if (parsed === null) return null;
  const dollars = assumeCents ? parsed / 100 : parsed;
  return `$${dollars.toFixed(2)}`;
}

function readNestedRecord(
  source: Record<string, unknown> | undefined,
  path: string[]
): Record<string, unknown> | undefined {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current && typeof current === "object"
    ? (current as Record<string, unknown>)
    : undefined;
}

function extractCardLabel(paymentCharge?: Record<string, unknown>): string | null {
  if (!paymentCharge) return null;

  const card =
    readNestedRecord(paymentCharge, ["payment_method_details", "card_present"]) ??
    readNestedRecord(paymentCharge, ["payment_method_details", "card"]);

  if (!card) return null;

  const brand = String(card.brand ?? "Card");
  const last4 = String(card.last4 ?? "****");
  return `${brand} •••• ${last4}`;
}

function buildStoreAddress(store: Store): string | undefined {
  const parts = [
    store.address?.physical || store.address?.line1,
    store.address?.state,
    store.address?.zip,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function buildBankReceiptPreviewModel({
  store,
  order,
  response,
  t,
}: {
  store: Store;
  order: BankReceiptOrderContext;
  response: BankReceiptCloudResponse;
  t: TranslateFn;
}): BankReceiptPreviewModel {
  const paymentCharge =
    response.paymentCharge && typeof response.paymentCharge === "object"
      ? response.paymentCharge
      : undefined;
  const transactionJson = order.transactionJson;
  const rows: BankReceiptPreviewRow[] = [];

  const pushRow = (
    labelKey: string,
    value: string | null | undefined,
    emphasize = false
  ) => {
    if (!value) return;
    rows.push({ label: t(labelKey), value, emphasize });
  };

  pushRow("revenue.bankReceiptPreview.orderId", `#${order.id}`);
  pushRow(
    "revenue.bankReceiptPreview.chargeId",
    String(response.Charge_ID ?? order.latestCharge ?? "")
  );
  pushRow(
    "revenue.bankReceiptPreview.date",
    formatBankReceiptDisplayDate(order.dateTime, order.time)
  );
  pushRow("revenue.bankReceiptPreview.guest", order.guest);
  pushRow("revenue.bankReceiptPreview.paymentMethod", order.channel);
  pushRow(
    "revenue.bankReceiptPreview.card",
    extractCardLabel(paymentCharge)
  );

  const grossAmount =
    formatUsd(paymentCharge?.amount, true) ??
    formatUsd(order.total ?? order.amount) ??
    null;
  pushRow("revenue.bankReceiptPreview.amount", grossAmount, true);

  const netAmount =
    formatUsd(transactionJson?.net) ??
    formatUsd(readNestedRecord(paymentCharge, ["balance_transaction"])?.net) ??
    formatUsd(paymentCharge?.amount_captured, true);
  pushRow("revenue.bankReceiptPreview.netAmount", netAmount, true);

  pushRow(
    "revenue.bankReceiptPreview.status",
    typeof paymentCharge?.status === "string" ? paymentCharge.status : null
  );

  if (typeof paymentCharge?.id === "string") {
    pushRow("revenue.bankReceiptPreview.stripeChargeId", paymentCharge.id);
  }

  if (typeof paymentCharge?.created === "number") {
    pushRow(
      "revenue.bankReceiptPreview.createdAt",
      new Date(paymentCharge.created * 1000).toLocaleString()
    );
  }

  return {
    title: t("revenue.bankReceiptPreview.title"),
    storeName: store.name,
    storeAddress: buildStoreAddress(store),
    rows,
    paymentCharge,
  };
}
