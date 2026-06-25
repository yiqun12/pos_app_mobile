import assert from "node:assert/strict";
import test from "node:test";

import { transformWebMenuItem } from "../lib/pos/menuTransforms.ts";

test("transforms Web attributesArr into App option groups", () => {
  const item = transformWebMenuItem(
    {
      id: "item-1",
      name: "Beef Noodle",
      CHI: "牛肉面",
      subtotal: "12.50",
      category: "Noodles",
      categoryCHI: "面",
      image: "https://example.com/noodle.jpg",
      attributesArr: {
        Size: {
          isSingleSelected: true,
          variations: [
            { type: "Small", price: -1 },
            { type: "Large", price: 2 },
          ],
        },
        Toppings: {
          isSingleSelected: false,
          variations: [{ type: "Egg", price: 1.5 }],
        },
      },
    },
    0
  );

  assert.equal(item.name, "Beef Noodle / 牛肉面");
  assert.equal(item.rawName, "Beef Noodle");
  assert.equal(item.nameCN, "牛肉面");
  assert.equal(item.price, 12.5);
  assert.equal(item.categoryId, "Noodles");
  assert.equal(item.optionGroups?.length, 2);
  assert.deepEqual(item.optionGroups?.[0], {
    id: "Size",
    name: "Size",
    type: "single",
    required: false,
    choices: [
      { id: "Size-Small", name: "Small", priceAdjustment: -1 },
      { id: "Size-Large", name: "Large", priceAdjustment: 2 },
    ],
  });
  assert.equal(item.attributesArr?.Size.isSingleSelected, true);
});
