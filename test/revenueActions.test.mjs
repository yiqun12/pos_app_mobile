import assert from "node:assert/strict";
import test from "node:test";
import { buildCashTipsPatch } from "../lib/pos/revenueActions.ts";

test("buildCashTipsPatch mirrors Web gratuity formula", () => {
  const patch = buildCashTipsPatch(
    {
      id: "order-1",
      total: 50,
      gratuity: 5,
      metadata: {
        total: 50,
        tips: 5,
        subtotal: 40,
      },
    },
    3
  );

  assert.equal(patch["metadata.tips"], 8);
  assert.equal(patch["metadata.total"], 53);
  assert.equal(patch.amount, 5300);
  assert.equal(patch.amount_received, 5300);
});

test("buildCashTipsPatch adds extra tip to existing metadata tips", () => {
  const patch = buildCashTipsPatch(
    {
      id: "order-2",
      metadata: {
        total: "100.00",
        tips: "10.00",
      },
    },
    2.5
  );

  assert.equal(patch["metadata.tips"], 12.5);
  assert.equal(patch["metadata.total"], 102.5);
});
