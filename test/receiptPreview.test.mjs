import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWebReceiptPrintPayload,
} from "../lib/pos/receiptPreviewCore.ts";

test("buildWebReceiptPrintPayload matches Web MerchantReceipt fields", () => {
  const payload = buildWebReceiptPrintPayload(
    {
      id: "order-1",
      tableNum: "G1",
      receiptData: JSON.stringify([
        { name: "Burger", quantity: 1, itemTotalPrice: 12 },
      ]),
      metadata: {
        discount: 1,
        service_fee: 2,
        tips: 5,
        total: 50,
      },
    },
    "MerchantReceipt",
    "2026-06-25-14-30-00-00"
  );

  assert.deepEqual(Object.keys(payload).sort(), [
    "data",
    "date",
    "discount",
    "selectedTable",
    "service_fee",
    "total",
  ]);
  assert.equal(payload.selectedTable, "G1");
  assert.equal(payload.discount, 1);
  assert.equal(payload.service_fee, 2);
  assert.equal(payload.total, 45);
  assert.equal(payload.data.length, 1);
});

test("Customer receipt payload keeps full total", () => {
  const payload = buildWebReceiptPrintPayload(
    {
      id: "order-2",
      metadata: { tips: 5, total: 50 },
    },
    "CustomerReceipt",
    "2026-06-25-14-30-00-00"
  );

  assert.equal(payload.total, 50);
});
