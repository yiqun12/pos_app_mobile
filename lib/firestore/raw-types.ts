/**
 * Raw Firestore document shapes. Mirrors what eatifyPos web writes.
 * Fields stored as JSON strings are typed as `string` here; parsing happens in repositories.
 */

export interface RawStoreDoc {
  Name?: string;
  storeNameCHI?: string;
  Address?: string;
  physical_address?: string;
  State?: string;
  ZipCode?: string;
  Phone?: string;
  Image?: string;
  Description?: string;
  Open_time?: string; // JSON string -> RawOpenHours
  restaurant_seat_arrangement?: string; // JSON string -> RawSeatLayout
  key?: string; // JSON string -> RawMenu
  globalModification?: string; // JSON string -> RawGlobalModifications
  TaxRate?: string; // numeric string
  dailyPayout?: boolean;
  storeOwnerId?: string;
}

export interface RawOpenHours {
  [day: string]: { open: string; close: string } | undefined;
}

export interface RawSeatLayout {
  table?: RawSeatItem[];
}

export interface RawSeatItem {
  id?: string;
  type?: string;
  tableName?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
}

/**
 * `key` field is a JSON object whose shape varies. Best-effort typing.
 */
export interface RawMenu {
  categories?: RawMenuCategory[];
  menu?: RawMenuItem[];
  items?: RawMenuItem[];
  [k: string]: unknown;
}

export interface RawMenuCategory {
  id?: string;
  name?: string;
  [k: string]: unknown;
}

export interface RawMenuItem {
  id?: string;
  name?: string;
  price?: number | string;
  category?: string;
  categoryId?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  attributes?: unknown[]; // option groups
  attributes2?: unknown[]; // ingredients
  [k: string]: unknown;
}

export interface RawGlobalModifications {
  list?: RawGlobalModItem[];
  [k: string]: unknown;
}

export interface RawGlobalModItem {
  type?: string;
  price?: number | string;
  typeCategory?: string;
  [k: string]: unknown;
}

/**
 * Table sub-collection document (current dine-in state).
 */
export interface RawTableDoc {
  table_name?: string;
  status?: string;
  itemCount?: number;
  [k: string]: unknown;
}

/**
 * PendingDineInOrder sub-collection document.
 */
export interface RawPendingOrderDoc {
  tableName?: string;
  items?: unknown[];
  total?: number | string;
  createdAt?: unknown; // Firestore Timestamp
  [k: string]: unknown;
}
