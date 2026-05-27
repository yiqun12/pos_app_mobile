import assert from "node:assert/strict";
import test from "node:test";

import { formatWebDate } from "../lib/pos/webDate.ts";

test("formats Web POS sortable date string", () => {
  assert.equal(
    formatWebDate(new Date("2026-05-27T12:34:56.780Z")),
    "2026-05-27-12-34-56-78"
  );
});
