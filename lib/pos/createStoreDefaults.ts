/** Default payloads when creating a store — aligned with eatifyPos demoFood.js */

const DEFAULT_OPEN_TIME = {
  "0": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "1": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "2": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "3": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "4": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "5": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "6": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
  "7": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "ET" },
};

const DEFAULT_SEAT_ARRANGEMENT = {
  table: [
    {
      type: "rect",
      left: 15,
      top: 75,
      width: 60,
      height: 60,
      scaleX: 1,
      scaleY: 1,
      tableName: "A1",
      id: "6od2zceo",
      snapAngle: 45,
      angle: 0,
    },
    {
      type: "rect",
      left: 90,
      top: 75,
      width: 60,
      height: 60,
      scaleX: 1,
      scaleY: 1,
      tableName: "A2",
      id: "cf9612mu",
      snapAngle: 45,
      angle: 0,
    },
    {
      type: "rect",
      left: 165,
      top: 75,
      width: 60,
      height: 60,
      scaleX: 1,
      scaleY: 1,
      tableName: "A3",
      id: "spkjh6o6",
      snapAngle: 45,
      angle: 0,
    },
  ],
  chair: [],
  wall: [],
};

const DEFAULT_GLOBAL_MODIFICATIONS = [
  { type: "外卖", price: 0, typeCategory: "要求添加" },
  { type: "加酱料", price: 0, typeCategory: "要求添加" },
  { type: "堂食", price: 0, typeCategory: "要求减少" },
  { type: "不要辣", price: 0, typeCategory: "要求减少" },
];

const DEFAULT_MENU = [
  {
    name: "House Special",
    category: "Main",
    CHI: "招牌菜",
    image: "https://s3-media0.fl.yelpcdn.com/bphoto/byOMYO520SGEYxKAbK_PYw/l.jpg",
    id: "demo-item-1",
    subtotal: 1,
    attributes: [],
    attributes2: [],
    attributesArr: {},
    availability: ["Morning", "Afternoon", "Evening"],
  },
];

export type CreateStoreInput = {
  storeName: string;
  storeNameCHI?: string;
  taxRate: string;
  city: string;
  physicalAddress?: string;
  state: string;
  zipCode: string;
  phone: string;
  description?: string;
};

export function buildNewStoreDocument(
  uid: string,
  storeId: string,
  input: CreateStoreInput
): Record<string, unknown> {
  return {
    Name: input.storeName.trim() || storeId,
    Address: input.city.trim(),
    Open_time: JSON.stringify(DEFAULT_OPEN_TIME),
    key: JSON.stringify(DEFAULT_MENU),
    Image: "https://s3-media0.fl.yelpcdn.com/bphoto/byOMYO520SGEYxKAbK_PYw/l.jpg",
    stripe_store_acct: "",
    storeOwnerId: uid,
    restaurant_seat_arrangement: JSON.stringify(DEFAULT_SEAT_ARRANGEMENT),
    storeNameCHI: input.storeNameCHI?.trim() ?? "",
    TaxRate: input.taxRate.trim() || "8.875",
    ZipCode: input.zipCode.trim(),
    State: input.state.trim(),
    Phone: input.phone.trim(),
    physical_address: input.physicalAddress?.trim() || input.city.trim(),
    Description: input.description?.trim() || "",
    dailyPayout: false,
    globalModification: JSON.stringify(DEFAULT_GLOBAL_MODIFICATIONS),
  };
}

export const DEFAULT_CREATE_STORE_TABLES = ["A1", "A2", "A3"] as const;

/** Default demo store for guest trial — aligned with eatifyPos demoFood.js */
export const GUEST_DEFAULT_STORE_INPUT: CreateStoreInput = {
  storeName: "demo",
  storeNameCHI: "demoStore",
  taxRate: "8.625",
  city: "San Francisco",
  physicalAddress: "123 Main Street",
  state: "CA",
  zipCode: "90011",
  phone: "4155551234",
  description: "",
};
