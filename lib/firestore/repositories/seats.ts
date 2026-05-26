import { db } from "@/lib/firebase";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { storeSubPath } from "../paths";
import type { RawTableDoc } from "../raw-types";
import type { TableStatus } from "../types";

/**
 * Subscribe to the Table sub-collection (current dine-in status of each table).
 * Returns an unsubscribe function.
 */
export function subscribeTableStatus(
  uid: string,
  storeId: string,
  onUpdate: (rows: TableStatus[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ...storeSubPath(uid, storeId, "Table"));
  return onSnapshot(
    colRef,
    (snap) => {
      const rows: TableStatus[] = snap.docs.map((d) => {
        const raw = d.data() as RawTableDoc;
        const itemCount = typeof raw.itemCount === "number" ? raw.itemCount : 0;
        const status =
          raw.status === "occupied" || raw.status === "reserved"
            ? raw.status
            : itemCount > 0
              ? "occupied"
              : "vacant";
        return {
          id: d.id,
          name: typeof raw.table_name === "string" ? raw.table_name : d.id,
          status,
          itemCount,
        };
      });
      onUpdate(rows);
    },
    (err) => onError(err)
  );
}

// Write API (P1)
export async function setTableStatus(
  _uid: string,
  _storeId: string,
  _tableName: string,
  _status: TableStatus["status"]
): Promise<void> {
  throw new Error("setTableStatus not implemented (P1)");
}
