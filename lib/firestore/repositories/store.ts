import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { storeListPath, storePath } from "../paths";
import type {
  RawGlobalModItem,
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
  GlobalModification,
  Menu,
  MenuCategory,
  MenuItem,
  Seat,
  SeatLayout,
  Store,
  StoreSummary,
} from "../types";

export async function getStoreList(uid: string): Promise<StoreSummary[]> {
  const colRef = collection(db, ...storeListPath(uid));
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => {
    const raw = d.data() as RawStoreDoc;
    return {
      id: d.id,
      name: raw.Name ?? d.id,
      nameCN: raw.storeNameCHI,
      image: raw.Image,
    } satisfies StoreSummary;
  });
}

export async function getStore(uid: string, storeId: string): Promise<Store | null> {
  const ref = doc(db, ...storePath(uid, storeId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return transformStore(snap.id, snap.data() as RawStoreDoc);
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
    globalModifications: transformGlobalMods(
      parseJsonField<RawGlobalModifications>(raw.globalModification, {})
    ),
    dailyPayout: raw.dailyPayout ?? false,
    storeOwnerId: raw.storeOwnerId,
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

    const priceVal = m.price ?? m.subtotal;
    const price = typeof priceVal === "number" ? priceVal : parseNumericField(priceVal, 0);

    const displayName = m.CHI && m.CHI !== m.name 
      ? `${m.name} / ${m.CHI}` 
      : (m.name ?? "Untitled");

    return {
      id: m.id ?? `item-${i}`,
      categoryId: catId,
      name: displayName,
      price,
      imageUrl: m.imageUrl ?? m.image,
      description: m.description,
    };
  });

  return { categories, items };
}

function transformGlobalMods(raw: RawGlobalModifications): GlobalModification[] {
  const list = (raw.list ?? []) as RawGlobalModItem[];
  return list.map((m, i): GlobalModification => {
    const cat = m.typeCategory === "要求减少" ? "要求减少" : "要求添加";
    return {
      id: `gm-${i}`,
      type: m.type ?? "",
      price: typeof m.price === "number" ? m.price : parseNumericField(m.price, 0),
      typeCategory: cat,
    };
  });
}

// Write API (P1 — not implemented)
export async function updateStore(_uid: string, _storeId: string, _patch: Partial<Store>): Promise<void> {
  throw new Error("updateStore not implemented (P1)");
}
