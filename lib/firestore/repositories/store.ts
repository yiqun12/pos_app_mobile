import { db } from "@/lib/firebase";
import { transformGlobalModifications } from "@/lib/pos/globalModificationTransforms";
import { transformWebMenuItem } from "@/lib/pos/menuTransforms";
import { collection, doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { storeListPath, storePath } from "../paths";
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
  const tables = (raw.table ?? []).map((t, i): Seat => ({
    id: t.id ?? `seat-${i}`,
    name: t.tableName ?? `T${i + 1}`,
    x: t.left ?? 0,
    y: t.top ?? 0,
    width: t.width ?? 60,
    height: t.height ?? 60,
    status: "vacant",
  }));
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
      });
      categoryIds.add(catId);
    });
  }

  const items: MenuItem[] = rawItems.map((m, i) => {
    const catName = m.category ?? "Uncategorized";
    const catId = m.categoryId ?? m.category ?? "uncategorized";

    if (!categoryIds.has(catId)) {
      const catDisplayName = m.categoryCHI && m.categoryCHI !== m.category 
        ? `${m.category} / ${m.categoryCHI}` 
        : catName;
      categories.push({
        id: catId,
        name: catDisplayName,
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
