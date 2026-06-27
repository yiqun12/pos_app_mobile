/**
 * Application-layer types. Pages and hooks use these.
 * Repositories convert RawStoreDoc -> Store.
 */

export interface StoreSummary {
  id: string;
  name: string;
  nameCN?: string;
  image?: string;
}

export interface StoreAddress {
  line1: string;
  physical: string;
  state: string;
  zip: string;
}

export interface OpenHours {
  [day: string]: { open: string; close: string } | undefined;
}

export type SeatShape = "rect" | "circle";

export interface Seat {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: SeatShape;
  radius?: number;
  status?: "vacant" | "reserved" | "occupied";
  itemCount?: number;
}

export interface SeatLayout {
  tables: Seat[];
}

export interface MenuCategory {
  id: string;
  name: string;
  nameCN?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  rawName?: string;
  nameCN?: string;
  categoryName?: string;
  categoryNameCN?: string;
  price: number;
  image?: string;
  imageUrl?: string;
  availability?: boolean | string | string[];
  attributesArr?: Record<
    string,
    {
      isSingleSelected?: boolean;
      variations?: { type?: string; price?: number | string }[];
    }
  >;
  optionGroups?: {
    id: string;
    name: string;
    type: "single" | "multi";
    required: boolean;
    choices: { id: string; name: string; priceAdjustment?: number }[];
  }[];
  ingredients?: { id: string; name: string; priceAdjustment?: number }[];
}

export interface Menu {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface GlobalModification {
  id: string;
  type: string;
  price: number;
  typeCategory: "要求添加" | "要求减少";
}

export interface Store {
  id: string;
  name: string;
  nameCN?: string;
  address: StoreAddress;
  phone: string;
  image?: string;
  description?: string;
  taxRate: number;
  openHours: OpenHours;
  seatLayout: SeatLayout;
  menu: Menu;
  globalModifications: GlobalModification[];
  dailyPayout: boolean;
  storeOwnerId?: string;
  stripeStoreAcct?: string;
}

export interface PendingOrder {
  id: string;
  tableName: string;
  total: number;
  itemCount: number;
  createdAtMs: number | null;
}

/** Pending dine-in notification row (mirrors eatifyPos Account_admin notification feed). */
export interface PendingNotificationOrder {
  id: string;
  tableName: string;
  status: string;
  username: string;
  date: string;
  dateMs: number | null;
  amount: number;
  itemCount: number;
  isConfirm: boolean;
}

export interface TableStatus {
  id: string;
  name: string;
  status: "vacant" | "reserved" | "occupied";
  itemCount: number;
}

/** Account payment history row (`stripe_customers/{uid}/payments`). */
export interface UserPaymentRecord {
  id: string;
  storeId: string;
  dateTime: string;
  displayDate: string;
  amount: number;
  channel: string;
  tableNum?: string;
  isDineIn: boolean;
  total: number;
  itemCount: number;
}

/**
 * Async result shape returned by hooks.
 */
export interface AsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
