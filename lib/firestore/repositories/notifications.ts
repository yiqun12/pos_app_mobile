import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { storeSubDocPath, storeSubPath } from "../paths";
import type { RawPendingOrderDoc } from "../raw-types";
import { parseNumericField } from "../serialize";
import type { PendingNotificationOrder } from "../types";

function parsePendingDateMs(date?: string): number | null {
  if (!date || typeof date !== "string") return null;
  const parsed = Date.parse(date);
  return Number.isFinite(parsed) ? parsed : null;
}

function countPendingItems(items: unknown[]): number {
  return items.reduce<number>((sum, item) => {
    if (item && typeof item === "object" && "quantity" in item) {
      const quantity = (item as { quantity?: unknown }).quantity;
      return sum + (typeof quantity === "number" ? quantity : 1);
    }
    return sum + 1;
  }, 0);
}

export function transformPendingNotificationOrder(
  id: string,
  raw: RawPendingOrderDoc
): PendingNotificationOrder {
  const tableName =
    typeof raw.table === "string"
      ? raw.table
      : typeof raw.tableName === "string"
        ? raw.tableName
        : "";
  const items = Array.isArray(raw.items) ? raw.items : [];
  const status =
    typeof raw.Status === "string"
      ? raw.Status
      : typeof raw.status === "string"
        ? raw.status
        : "Pending";

  return {
    id,
    tableName,
    status,
    username: typeof raw.username === "string" ? raw.username : "",
    date: typeof raw.date === "string" ? raw.date : "",
    dateMs: parsePendingDateMs(typeof raw.date === "string" ? raw.date : undefined),
    amount: parseNumericField(raw.amount ?? raw.total, 0),
    itemCount: items.length > 0 ? countPendingItems(items) : 0,
    isConfirm: raw.isConfirm === true,
  };
}

/** Realtime pending notifications — same source as eatifyPos Account_admin. */
export function subscribePendingNotifications(
  uid: string,
  storeId: string,
  onUpdate: (orders: PendingNotificationOrder[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ...storeSubPath(uid, storeId, "PendingDineInOrder"));
  return onSnapshot(
    query(colRef),
    (snap) => {
      const orders = snap.docs
        .map((d) => transformPendingNotificationOrder(d.id, d.data() as RawPendingOrderDoc))
        .filter((order) => !order.isConfirm);
      onUpdate(orders);
    },
    (err) => onError(err)
  );
}

/** Matches web Test_Notification_Page deleteDocument — dismisses one notification. */
export async function confirmPendingNotification(
  uid: string,
  storeId: string,
  orderId: string
): Promise<void> {
  const docRef = doc(db, ...storeSubDocPath(uid, storeId, "PendingDineInOrder", orderId));
  await updateDoc(docRef, { isConfirm: true });
}

export async function confirmAllPendingNotifications(
  uid: string,
  storeId: string,
  orderIds: string[]
): Promise<void> {
  await Promise.all(orderIds.map((orderId) => confirmPendingNotification(uid, storeId, orderId)));
}
