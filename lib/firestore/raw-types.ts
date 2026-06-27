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
  stripe_store_acct?: string;
}

export interface RawOpenHours {
  [day: string]: { open: string; close: string } | undefined;
}

export interface RawSeatLayout {
  table?: RawSeatItem[];
  chair?: RawSeatItem[];
  wall?: RawSeatItem[];
}

export interface RawSeatItem {
  id?: string;
  type?: string;
  tableName?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  radius?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  snapAngle?: number;
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
  nameCN?: string;
  categoryCHI?: string;
  [k: string]: unknown;
}

export interface RawMenuItem {
  id?: string;
  name?: string;
  CHI?: string;
  price?: number | string;
  subtotal?: number | string;
  category?: string;
  categoryCHI?: string;
  categoryId?: string;
  image?: string;
  imageUrl?: string;
  availability?: boolean | string | string[];
  attributesArr?: unknown;
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
  table?: string;
  tableName?: string;
  items?: unknown[];
  total?: number | string;
  amount?: number | string;
  Status?: string;
  status?: string;
  username?: string;
  date?: string;
  isConfirm?: boolean;
  store?: string;
  stripe_account_store_owner?: string;
  createdAt?: unknown;
  [k: string]: unknown;
}
