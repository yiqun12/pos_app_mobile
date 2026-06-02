export type SelectedOption = {
  groupId: string;
  groupName: string;
  selectedChoices: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
};

export type SelectedGlobalCustomization = {
  id: string;
  type: string;
  price: number;
  typeCategory: "要求添加" | "要求减少";
};

export type OrderItem = {
  id: string;
  menuItemId?: string;
  name: string;
  rawName?: string;
  nameCN?: string;
  price: number;
  quantity: number;
  count?: number | string;
  imageUrl?: string;
  attributesArr?: Record<
    string,
    {
      isSingleSelected?: boolean;
      variations?: { type?: string; price?: number | string }[];
    }
  >;
  attributeSelected?: Record<string, string | string[]>;
  notes?: string;
  originalPrice?: number; // In case of manual override
  selectedOptions?: SelectedOption[]; // User-selected options
  selectedIngredients?: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[]; // User-selected ingredients
  selectedGlobalCustomizations?: SelectedGlobalCustomization[]; // Global customizations (e.g., 外卖, 加辣)
};

export type OrderStatus = "unpaid" | "paid" | "partially_paid";

export type PaymentMethod = "cash" | "card" | "split";

export type Order = {
  id: string;
  seatId: string;
  items: OrderItem[];
  subtotal: number;
  taxableSubtotal?: number;
  taxRate: number;
  taxAmount: number;
  serviceFee: number;
  manualAdjustment: number;
  discount?: number;
  surcharge?: number;
  taxExempt?: boolean;
  total: number;
  status: OrderStatus;
  paidAmount: number;
  createdAt: number;
};

export type SeatStatus = "vacant" | "reserved" | "occupied";

export interface Seat {
  id: string;
  name: string; // tableName from Firebase (e.g., "A2", "B1")
  status: SeatStatus;
  itemCount?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}
