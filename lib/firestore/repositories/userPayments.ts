import { db } from "@/lib/firebase";
import { parseTimeToDisplay } from "@/lib/pos/revenueTransforms";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import type { UserPaymentRecord } from "../types";

type RawUserPaymentDoc = {
  status?: string;
  store?: string;
  dateTime?: string;
  user_email?: string;
  receiptData?: string;
  powerBy?: string;
  tableNum?: string;
  amount?: number | string;
  metadata?: {
    isDine?: boolean | string;
    total?: number | string;
    subtotal?: number | string;
    tax?: number | string;
    tips?: number | string;
  };
};

function parseAmountCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseMetadataNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function transformUserPayment(id: string, raw: RawUserPaymentDoc): UserPaymentRecord | null {
  if (raw.status !== "succeeded") return null;

  const storeId = typeof raw.store === "string" ? raw.store : "";
  const dateTime = typeof raw.dateTime === "string" ? raw.dateTime : "";
  const amountCents = parseAmountCents(raw.amount);
  let itemCount = 0;

  if (typeof raw.receiptData === "string" && raw.receiptData.trim()) {
    try {
      const items = JSON.parse(raw.receiptData);
      if (Array.isArray(items)) {
        itemCount = items.reduce((sum, item) => {
          const quantity =
            item && typeof item === "object" && "quantity" in item
              ? Number((item as { quantity?: unknown }).quantity)
              : 1;
          return sum + (Number.isFinite(quantity) ? quantity : 1);
        }, 0);
      }
    } catch {
      itemCount = 0;
    }
  }

  const metadata = raw.metadata ?? {};
  const isDineRaw = metadata.isDine;
  const isDineIn = isDineRaw === true || isDineRaw === "DineIn" || isDineRaw === "true";

  return {
    id,
    storeId,
    dateTime,
    displayDate: parseTimeToDisplay(dateTime) || dateTime,
    amount: Math.round((amountCents / 100) * 100) / 100,
    channel: typeof raw.powerBy === "string" ? raw.powerBy : "—",
    tableNum: typeof raw.tableNum === "string" ? raw.tableNum : undefined,
    isDineIn,
    total: parseMetadataNumber(metadata.total),
    itemCount,
  };
}

/** Realtime account payment history — mirrors eatifyPos PayFullhistory. */
export function subscribeUserPayments(
  uid: string,
  onUpdate: (payments: UserPaymentRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, "stripe_customers", uid, "payments");
  return onSnapshot(
    query(colRef, orderBy("dateTime", "desc")),
    (snap) => {
      const payments = snap.docs
        .map((docSnap) => transformUserPayment(docSnap.id, docSnap.data() as RawUserPaymentDoc))
        .filter((payment): payment is UserPaymentRecord => payment !== null);
      onUpdate(payments);
    },
    (err) => onError(err)
  );
}
