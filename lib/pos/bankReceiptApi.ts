import { functions } from "@/lib/firebase";
import type { BankReceiptCloudResponse } from "@/lib/pos/bankReceiptCore";
import { httpsCallable } from "firebase/functions";

export type BankReceiptRequest = {
  chargeId: string;
  docId: string;
  displayDate: string;
  stripeStoreAcct: string;
};

export async function fetchBankReceiptViaCloudFunction(
  request: BankReceiptRequest
): Promise<BankReceiptCloudResponse> {
  const bankReceiptFn = httpsCallable<
    {
      Charge_ID: string;
      docId: string;
      displayDate: string;
      acct: string;
    },
    BankReceiptCloudResponse
  >(functions, "bankReceipt");

  const result = await bankReceiptFn({
    Charge_ID: request.chargeId,
    docId: request.docId,
    displayDate: request.displayDate,
    acct: request.stripeStoreAcct,
  });

  return result.data ?? {};
}
