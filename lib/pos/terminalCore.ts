import { db, functions } from "@/lib/firebase";
import type { Store } from "@/lib/firestore/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { storeSubDocPath } from "@/lib/firestore/paths";

export type TerminalDoc = {
  id: string;
  locationId?: string;
  readerId?: string;
  reader_id?: string;
  isActive?: boolean;
  date?: string;
  name?: string;
  label?: string;
  status?: string;
};

export type RegisterTerminalInput = {
  uid: string;
  storeId: string;
  store: Store;
  registrationCode: string;
  storeDisplayName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

function buildTerminalDateStamp(): string {
  const dateTime = new Date().toISOString();
  return (
    dateTime.slice(0, 10) +
    "-" +
    dateTime.slice(11, 13) +
    "-" +
    dateTime.slice(14, 16) +
    "-" +
    dateTime.slice(17, 19) +
    "-" +
    dateTime.slice(20, 22)
  );
}

/** Web TerminalRegister date display — e.g. 2025年2月25日 or 02/25/2025 */
export function formatTerminalAddedDate(
  dateString?: string,
  language: "zh" | "en" = "en"
): string {
  if (!dateString) return "-";
  const parts = dateString.split("-");
  if (parts.length < 3) return dateString;

  const year = parts[0];
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return dateString;

  if (language === "zh") {
    return `${year}年${month}月${day}日`;
  }
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

export function getTerminalReaderId(terminal: TerminalDoc | null | undefined): string | null {
  if (!terminal) return null;
  return terminal.readerId ?? terminal.reader_id ?? null;
}

export function buildTableScanPayUrl(storeId: string, tableName: string): string {
  return `https://7dollar.delivery/store?store=${storeId}&table=${encodeURIComponent(tableName)}`;
}

export async function registerTerminal({
  uid,
  storeId,
  store,
  registrationCode,
  storeDisplayName,
  streetAddress,
  city,
  state,
  zipCode,
}: RegisterTerminalInput): Promise<void> {
  const code = registrationCode.trim();
  if (!code) throw new Error("TERMINAL_CODE_REQUIRED");

  const stripeAccount = store.stripeStoreAcct;
  if (!stripeAccount) throw new Error("STRIPE_NOT_CONNECTED");

  const terminalRef = doc(db, ...storeSubDocPath(uid, storeId, "terminals", code));
  const existing = await getDoc(terminalRef);
  if (existing.exists()) throw new Error("TERMINAL_ALREADY_EXISTS");

  const createLocation = httpsCallable(functions, "createLocation");
  const registerReader = httpsCallable(functions, "registerReader");

  const locationResponse: any = await createLocation({
    connected_stripe_account_id: stripeAccount,
    display_name: (storeDisplayName ?? store.name).trim() || store.name,
    address: {
      line1: (streetAddress ?? store.address.physical ?? store.address.line1).trim(),
      city: (city ?? store.address.line1).trim(),
      state: (state ?? store.address.state).trim(),
      country: "US",
      postal_code: (zipCode ?? store.address.zip).trim(),
    },
  });

  const locationId = locationResponse.data?.id;
  if (!locationId) throw new Error("CREATE_LOCATION_FAILED");

  const readerResponse: any = await registerReader({
    location_id: locationId,
    terminal_code: code,
    connected_stripe_account_id: stripeAccount,
  });

  const readerId = readerResponse.data?.id;
  if (!readerId) throw new Error("REGISTER_READER_FAILED");

  const date = buildTerminalDateStamp();
  const payload = {
    locationId,
    readerId,
    isActive: true,
    date,
  };

  await setDoc(terminalRef, payload);

  const kioskRef = doc(db, ...storeSubDocPath(uid, storeId, "kiosk", code));
  const kioskExisting = await getDoc(kioskRef);
  if (!kioskExisting.exists()) {
    await setDoc(kioskRef, payload);
  }
}

export async function resetTerminalReader({
  uid,
  storeId,
  stripeAccountId,
  terminal,
}: {
  uid: string;
  storeId: string;
  stripeAccountId: string;
  terminal: TerminalDoc;
}): Promise<void> {
  const readerId = getTerminalReaderId(terminal);
  if (!readerId) throw new Error("TERMINAL_READER_MISSING");

  const cancelAction = httpsCallable(functions, "cancelAction");
  await cancelAction({
    reader_id: readerId,
    connected_stripe_account_id: stripeAccountId,
    storeID: storeId,
  });
}

export async function processTerminalTestPayment({
  uid,
  storeId,
  stripeAccountId,
  terminal,
  tableName,
  userEmail,
  amountCents = 100,
}: {
  uid: string;
  storeId: string;
  stripeAccountId: string;
  terminal: TerminalDoc;
  tableName: string;
  userEmail?: string | null;
  amountCents?: number;
}): Promise<string> {
  const readerId = getTerminalReaderId(terminal);
  if (!readerId) throw new Error("TERMINAL_READER_MISSING");

  const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
  const processPayment = httpsCallable(functions, "processPayment");

  const intentResponse: any = await createPaymentIntent({
    amount: amountCents,
    connected_stripe_account_id: stripeAccountId,
    receipt_JSON: "[]",
    storeID: storeId,
    selectedTable: tableName,
    uid,
    user_email: userEmail ?? "",
    discount: 0,
    service_fee: 0,
  });

  const paymentIntentId = intentResponse.data?.id;
  if (!paymentIntentId) throw new Error("CREATE_PAYMENT_INTENT_FAILED");

  await processPayment({
    reader_id: readerId,
    payment_intent_id: paymentIntentId,
    connected_stripe_account_id: stripeAccountId,
    amount: amountCents,
  });

  return paymentIntentId;
}
