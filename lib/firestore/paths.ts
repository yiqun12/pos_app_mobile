// Centralized Firestore path builders. Mirror web (eatifyPos) structure exactly.
// stripe_customers/{uid}/TitleLogoNameContent/{storeId}/...

const CUSTOMERS = "stripe_customers";
const STORES = "TitleLogoNameContent";

export type SubCollectionName =
  | "Table"
  | "TableIsSent"
  | "SendToKitchen"
  | "DeletedSendToKitchen"
  | "PendingDineInOrder"
  | "listOrder"
  | "success_payment"
  | "MerchantReceipt"
  | "CustomerReceipt"
  | "bankReceipt"
  | "OpenCashDraw"
  | "terminals"
  | "kiosk";

export function storeListPath(uid: string): readonly [string, string, string] {
  return [CUSTOMERS, uid, STORES] as const;
}

export function storePath(
  uid: string,
  storeId: string
): readonly [string, string, string, string] {
  return [CUSTOMERS, uid, STORES, storeId] as const;
}

export function storeSubPath(
  uid: string,
  storeId: string,
  name: SubCollectionName
): readonly [string, string, string, string, string] {
  return [...storePath(uid, storeId), name] as const;
}

export function storeSubDocPath(
  uid: string,
  storeId: string,
  name: SubCollectionName,
  docId: string
): readonly [string, string, string, string, string, string] {
  return [...storeSubPath(uid, storeId, name), docId] as const;
}
