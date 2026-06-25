import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { storeSubPath } from "../paths";
import type { RawPendingOrderDoc } from "../raw-types";
import { parseNumericField } from "../serialize";
import type { PendingOrder } from "../types";

export function subscribePendingOrders(
  uid: string,
  storeId: string,
  onUpdate: (orders: PendingOrder[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ...storeSubPath(uid, storeId, "PendingDineInOrder"));
  return onSnapshot(
    query(colRef),
    (snap) => {
      const orders: PendingOrder[] = snap.docs.map((d) => {
        const raw = d.data() as RawPendingOrderDoc;
        return {
          id: d.id,
          tableName: typeof raw.tableName === "string" ? raw.tableName : "",
          total:
            typeof raw.total === "number" ? raw.total : parseNumericField(raw.total, 0),
          itemCount: Array.isArray(raw.items) ? raw.items.length : 0,
          createdAtMs:
            raw.createdAt && typeof raw.createdAt === "object" && "toMillis" in raw.createdAt
              ? (raw.createdAt as { toMillis: () => number }).toMillis()
              : null,
        };
      });
      onUpdate(orders);
    },
    (err) => onError(err)
  );
}

export function subscribeListOrders(
  uid: string,
  storeId: string,
  onUpdate: (orders: any[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ...storeSubPath(uid, storeId, "listOrder"));
  return onSnapshot(
    colRef,
    (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(orders);
    },
    (err) => onError(err)
  );
}
