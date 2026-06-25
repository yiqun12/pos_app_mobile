import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOrderTotals,
  cleanProductData,
  createWebCartItem,
  diffKitchenChanges,
} from "../lib/pos/orderTransforms.ts";

const menuItem = {
  id: "m1",
  categoryId: "Noodles",
  name: "Beef Noodle / 牛肉面",
  rawName: "Beef Noodle",
  nameCN: "牛肉面",
  price: 12,
  attributesArr: {
    Size: {
      isSingleSelected: true,
      variations: [{ type: "Large", price: 2 }],
    },
    Toppings: {
      isSingleSelected: false,
      variations: [{ type: "Egg", price: 1 }],
    },
  },
};

test("creates Web-compatible cart item from selected options and requests", () => {
  const cartItem = createWebCartItem({
    orderItem: {
      id: "row-1",
      menuItemId: "m1",
      name: "Beef Noodle / 牛肉面",
      price: 15,
      quantity: 2,
      selectedOptions: [
        {
          groupId: "Size",
          groupName: "Size",
          selectedChoices: [{ id: "Size-Large", name: "Large", priceAdjustment: 2 }],
        },
        {
          groupId: "Toppings",
          groupName: "Toppings",
          selectedChoices: [{ id: "Toppings-Egg", name: "Egg", priceAdjustment: 1 }],
        },
      ],
      selectedGlobalCustomizations: [
        { id: "gm-1", type: "No onion", price: 0, typeCategory: "要求减少" },
      ],
    },
    menuItem,
    count: 123,
  });

  assert.equal(cartItem.id, "m1");
  assert.equal(cartItem.name, "Beef Noodle");
  assert.equal(cartItem.CHI, "牛肉面");
  assert.equal(cartItem.subtotal, "15.00");
  assert.equal(cartItem.quantity, 2);
  assert.equal(cartItem.itemTotalPrice, 30);
  assert.deepEqual(cartItem.attributeSelected, {
    Size: "Large",
    Toppings: ["Egg"],
    "要求减少": ["No onion"],
  });
  assert.equal(cartItem.attributesArr?.Size.isSingleSelected, true);
});

test("calculates totals with discount, tax exemption, service fee, and tip", () => {
  const totals = calculateOrderTotals({
    itemsSubtotal: 100,
    taxRate: 8.875,
    discount: 10,
    serviceFee: 5,
    tip: 3,
    taxExempt: false,
  });

  assert.deepEqual(totals, {
    subtotal: 100,
    discount: 10,
    taxableSubtotal: 90,
    tax: 7.99,
    serviceFee: 5,
    tip: 3,
    total: 105.99,
  });
});

test("diffs kitchen additions and deletions by count and quantity", () => {
  const diff = diffKitchenChanges(
    [{ count: 1, quantity: 2, itemTotalPrice: 20 }, { count: 2, quantity: 1, itemTotalPrice: 8 }],
    [{ count: 1, quantity: 3, itemTotalPrice: 30 }, { count: 3, quantity: 1, itemTotalPrice: 5 }]
  );

  assert.deepEqual(diff.added.map((item) => [item.count, item.quantity, item.itemTotalPrice]), [
    [1, 1, 10],
    [3, 1, 5],
  ]);
  assert.deepEqual(diff.deleted.map((item) => [item.count, item.quantity, item.itemTotalPrice]), [
    [2, 1, 8],
  ]);
});

test("cleans table start timestamp attributes for printable payloads", () => {
  const cleaned = cleanProductData([
    {
      name: "Pool Table",
      isNew: true,
      attributeSelected: {
        "开台商品": ["开台时间-1716811200000", "开台时间-1716811200000"],
      },
    },
  ]);

  assert.equal(cleaned[0].isNew, false);
  assert.equal(cleaned[0].attributeSelected["开台商品"].length, 1);
  assert.match(cleaned[0].attributeSelected["开台商品"][0], /^Start Time: \d{2}:\d{2}$/);
});
