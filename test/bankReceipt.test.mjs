import assert from "node:assert/strict";
import test from "node:test";
import {
  canRequestBankReceipt,
  formatBankReceiptDisplayDate,
  isValidStripeChargeId,
} from "../lib/pos/bankReceiptCore.ts";

test("isValidStripeChargeId accepts real Stripe charge ids", () => {
  assert.equal(isValidStripeChargeId("ch_3Of86QBUAXdEY4mJ2T9MBbRr"), true);
  assert.equal(isValidStripeChargeId("ch_none"), false);
  assert.equal(isValidStripeChargeId(""), false);
  assert.equal(isValidStripeChargeId(undefined), false);
});

test("canRequestBankReceipt requires charge id and connected Stripe account", () => {
  assert.equal(
    canRequestBankReceipt({ latestCharge: "ch_123" }, "acct_123"),
    true
  );
  assert.equal(canRequestBankReceipt({ latestCharge: "ch_none" }, "acct_123"), false);
  assert.equal(canRequestBankReceipt({ latestCharge: "ch_123" }, ""), false);
  assert.equal(canRequestBankReceipt(null, "acct_123"), false);
});

test("formatBankReceiptDisplayDate formats web dateTime strings", () => {
  assert.equal(
    formatBankReceiptDisplayDate("2026-06-25-14-30-00-00"),
    "06/25/2026 14:30"
  );
});
