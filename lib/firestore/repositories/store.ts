import { db } from "@/lib/firebase";
import { transformGlobalModifications } from "@/lib/pos/globalModificationTransforms";
import { transformWebMenuItem } from "@/lib/pos/menuTransforms";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { serializeSeatLayout } from "@/lib/pos/seatLayout";
import {
  buildNewStoreDocument,
  DEFAULT_CREATE_STORE_TABLES,
  type CreateStoreInput,
} from "@/lib/pos/createStoreDefaults";
import { generateStoreId } from "@/lib/pos/generateStoreId";
import { storeListPath, storePath, storeSubDocPath } from "../paths";
import type {
  RawGlobalModifications,
  RawMenuCategory,
  RawMenuItem,
  RawOpenHours,
  RawSeatLayout,
  RawStoreDoc,
} from "../raw-types";
import {
  parseJsonField,
  parseNumericField,
} from "../serialize";
import type {
  Menu,
  MenuCategory,
  MenuItem,
  Seat,
  SeatLayout,
  Store,
  StoreSummary,
} from "../types";

export function subscribeStoreList(
  uid: string,
  onUpdate: (list: StoreSummary[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ...storeListPath(uid));
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => {
        const raw = d.data() as RawStoreDoc;
        return {
          id: d.id,
          name: raw.Name ?? d.id,
          nameCN: raw.storeNameCHI,
          image: raw.Image,
        } satisfies StoreSummary;
      });
      onUpdate(list.reverse());
    },
    (err) => onError(err)
  );
}

export function subscribeStore(
  uid: string,
  storeId: string,
  onUpdate: (store: Store | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const ref = doc(db, ...storePath(uid, storeId));
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate(transformStore(snap.id, snap.data() as RawStoreDoc));
      }
    },
    (err) => onError(err)
  );
}

export async function fetchStore(uid: string, storeId: string): Promise<Store | null> {
  const ref = doc(db, ...storePath(uid, storeId));
  const snap = await getDoc(ref);
  return snap.exists() ? transformStore(snap.id, snap.data() as RawStoreDoc) : null;
}

function transformStore(id: string, raw: RawStoreDoc): Store {
  return {
    id,
    name: raw.Name ?? id,
    nameCN: raw.storeNameCHI,
    address: {
      line1: raw.Address ?? "",
      physical: raw.physical_address ?? "",
      state: raw.State ?? "",
      zip: raw.ZipCode ?? "",
    },
    phone: raw.Phone ?? "",
    image: raw.Image,
    description: raw.Description,
    taxRate: parseNumericField(raw.TaxRate, 0),
    openHours: parseJsonField<RawOpenHours>(raw.Open_time, {}),
    seatLayout: transformSeatLayout(
      parseJsonField<RawSeatLayout>(raw.restaurant_seat_arrangement, {})
    ),
    menu: transformMenu(parseJsonField<any>(raw.key, [])),
    globalModifications: transformGlobalModifications(
      parseJsonField<RawGlobalModifications>(raw.globalModification, {})
    ),
    dailyPayout: raw.dailyPayout ?? false,
    storeOwnerId: raw.storeOwnerId,
    stripeStoreAcct: raw.stripe_store_acct,
  };
}

function transformSeatLayout(raw: RawSeatLayout): SeatLayout {
  const tables = (raw.table ?? []).map((t, i): Seat => {
    if (t.type === "circle") {
      const radius = t.radius ?? 30;
      const diameter = radius * 2;
      return {
        id: t.id ?? `seat-${i}`,
        name: t.tableName ?? `T${i + 1}`,
        type: "circle",
        radius,
        x: t.left ?? 0,
        y: t.top ?? 0,
        width: diameter,
        height: diameter,
        status: "vacant",
      };
    }
    return {
      id: t.id ?? `seat-${i}`,
      name: t.tableName ?? `T${i + 1}`,
      type: "rect",
      x: t.left ?? 0,
      y: t.top ?? 0,
      width: t.width ?? 60,
      height: t.height ?? 60,
      status: "vacant",
    };
  });
  return { tables };
}

function transformMenu(raw: any): Menu {
  let rawItems: RawMenuItem[] = [];
  let rawCats: RawMenuCategory[] = [];

  if (Array.isArray(raw)) {
    rawItems = raw as RawMenuItem[];
  } else if (raw && typeof raw === "object") {
    rawItems = ((raw.menu ?? raw.items) ?? []) as RawMenuItem[];
    rawCats = (raw.categories ?? []) as RawMenuCategory[];
  }

  const categories: MenuCategory[] = [];
  const categoryIds = new Set<string>();

  if (rawCats.length > 0) {
    rawCats.forEach((c, i) => {
      const catId = c.id ?? `cat-${i}`;
      categories.push({
        id: catId,
        name: c.name ?? `Category ${i + 1}`,
        nameCN: c.nameCN ?? c.categoryCHI,
      });
      categoryIds.add(catId);
    });
  }

  const items: MenuItem[] = rawItems.map((m, i) => {
    const catName = m.category ?? "Uncategorized";
    const catId = m.categoryId ?? m.category ?? "uncategorized";

    if (!categoryIds.has(catId)) {
      categories.push({
        id: catId,
        name: catName,
        nameCN: m.categoryCHI,
      });
      categoryIds.add(catId);
    }

    return transformWebMenuItem(m, i);
  });

  return { categories, items };
}

// Write API (P1 — not implemented)
export async function updateStore(_uid: string, _storeId: string, _patch: Partial<Store>): Promise<void> {
  throw new Error("updateStore not implemented (P1)");
}

/** Persist seat layout to Firestore, mirroring web iframeDesk handleFormSubmit. */
export async function saveSeatLayout(
  uid: string,
  storeId: string,
  layout: SeatLayout,
  previousLayout: SeatLayout | null
): Promise<void> {
  const prevNames = new Set((previousLayout?.tables ?? []).map((t) => t.name));
  const nextNames = new Set(layout.tables.map((t) => t.name));

  const added = layout.tables.filter((t) => !prevNames.has(t.name));
  const deleted = (previousLayout?.tables ?? []).filter((t) => !nextNames.has(t.name));

  await Promise.all([
    ...added.map((seat) =>
      setDoc(
        doc(db, ...storeSubDocPath(uid, storeId, "Table", `${storeId}-${seat.name}`)),
        { product: "[]" },
        { merge: true }
      )
    ),
    ...deleted.map((seat) =>
      deleteDoc(doc(db, ...storeSubDocPath(uid, storeId, "Table", `${storeId}-${seat.name}`)))
    ),
  ]);

  await updateDoc(doc(db, ...storePath(uid, storeId)), {
    restaurant_seat_arrangement: JSON.stringify(serializeSeatLayout(layout)),
  });
}

export type { CreateStoreInput };

export async function createStore(
  uid: string,
  input: CreateStoreInput,
  existingStoreIds: string[]
): Promise<string> {
  const storeId = generateStoreId(
    {
      storeName: input.storeName,
      city: input.city,
      zipCode: input.zipCode,
    },
    existingStoreIds
  );

  if (!storeId) {
    throw new Error("STORE_ID_GENERATION_FAILED");
  }

  const storeRef = doc(db, ...storePath(uid, storeId));
  const existing = await getDoc(storeRef);
  if (existing.exists()) {
    throw new Error("STORE_ID_EXISTS");
  }

  await setDoc(storeRef, buildNewStoreDocument(uid, storeId, input));

  await Promise.all(
    DEFAULT_CREATE_STORE_TABLES.map((tableName) =>
      setDoc(
        doc(db, ...storeSubDocPath(uid, storeId, "Table", `${storeId}-${tableName}`)),
        { product: "[]" }
      )
    )
  );

  return storeId;
}
