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
      const prefix = `${storeId}-`;
      const rows: TableStatus[] = snap.docs.map((d) => {
        const raw = d.data() as RawTableDoc;
        
        // Slicing storeId prefix from d.id to get the table name (e.g. demo-A1 -> A1)
        const name = d.id.startsWith(prefix) ? d.id.slice(prefix.length) : d.id;
        
        let itemCount = 0;
        if (typeof raw.product === "string" && raw.product !== "[]") {
          try {
            const parsed = JSON.parse(raw.product);
            if (Array.isArray(parsed)) {
              itemCount = parsed.reduce(
                (sum: number, item: any) => sum + (typeof item.quantity === "number" ? item.quantity : 1),
                0
              );
            }
          } catch (e) {
            console.error("Error parsing product JSON in subscribeTableStatus:", e);
          }
        }

        // occupied if itemCount > 0, otherwise vacant
        let status: TableStatus["status"] = "vacant";
        if (itemCount > 0) {
          status = "occupied";
        }

        return {
          id: d.id,
          name,
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
