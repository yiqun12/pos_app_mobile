import type { GlobalModification, Menu, Seat, Store } from "./types";

export const MOCK_SEATS: Seat[] = [
  { id: "1", name: "A1", status: "vacant", x: 20, y: 20, width: 60, height: 60 },
  { id: "2", name: "A2", status: "reserved", x: 120, y: 20, width: 60, height: 60 },
  { id: "3", name: "A3", status: "occupied", itemCount: 3, x: 220, y: 20, width: 60, height: 60 },
  { id: "4", name: "B1", status: "vacant", x: 20, y: 120, width: 60, height: 60 },
  { id: "5", name: "B2", status: "occupied", itemCount: 1, x: 120, y: 120, width: 60, height: 60 },
  { id: "6", name: "B3", status: "vacant", x: 220, y: 120, width: 60, height: 60 },
  { id: "7", name: "C1", status: "reserved", x: 20, y: 220, width: 60, height: 60 },
  { id: "8", name: "C2", status: "occupied", itemCount: 2, x: 120, y: 220, width: 60, height: 60 },
];

export const MOCK_MENU: Menu = {
  categories: [
    { id: "c1", name: "Appetizers" },
    { id: "c2", name: "Main Courses" },
    { id: "c3", name: "Dim Sum" },
    { id: "c4", name: "Beverages" },
  ],
  items: [
    { id: "m1", categoryId: "c1", name: "Spring Rolls", price: 5 },
    { id: "m2", categoryId: "c1", name: "Garlic Romaine Lettuce", price: 15 },
    { id: "m3", categoryId: "c2", name: "Sichuan Style Chicken", price: 16.95 },
    { id: "m4", categoryId: "c2", name: "Eel Claypot Crispy Rice", price: 15.8 },
    { id: "m5", categoryId: "c3", name: "Beef Rice Noodle Rolls", price: 6.8 },
    { id: "m6", categoryId: "c3", name: "Pork Dumplings (3pc)", price: 7.2 },
    { id: "m7", categoryId: "c3", name: "Scallop Congee", price: 8.5 },
  ],
};

export const MOCK_GLOBAL_MODIFICATIONS: GlobalModification[] = [
  { id: "gc-1", type: "外卖", price: 0, typeCategory: "要求添加" },
  { id: "gc-2", type: "加酱料", price: 0, typeCategory: "要求添加" },
  { id: "gc-3", type: "加饭", price: 0, typeCategory: "要求添加" },
  { id: "gc-4", type: "加辣", price: 0, typeCategory: "要求添加" },
  { id: "gc-5", type: "加葱", price: 0, typeCategory: "要求添加" },
  { id: "gc-6", type: "堂食", price: 0, typeCategory: "要求减少" },
  { id: "gc-7", type: "不要酱料", price: 0, typeCategory: "要求减少" },
  { id: "gc-8", type: "不要辣", price: 0, typeCategory: "要求减少" },
  { id: "gc-9", type: "不要葱", price: 0, typeCategory: "要求减少" },
];

export const MOCK_STORE: Store = {
  id: "mock-store",
  name: "Demo Store",
  nameCN: "示例餐厅",
  address: { line1: "123 Demo St", physical: "Demo City", state: "CA", zip: "94103" },
  phone: "(555) 000-0000",
  taxRate: 8.5,
  openHours: {},
  seatLayout: { tables: MOCK_SEATS },
  menu: MOCK_MENU,
  globalModifications: MOCK_GLOBAL_MODIFICATIONS,
  dailyPayout: false,
};
