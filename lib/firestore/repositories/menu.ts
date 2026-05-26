import type { Menu } from "../types";

// Write API (P1) — menu is currently part of the Store doc's `key` JSON field.
// Updating menu means writing the whole `key` field on the store doc.
export async function updateMenu(
  _uid: string,
  _storeId: string,
  _menu: Menu
): Promise<void> {
  throw new Error("updateMenu not implemented (P1)");
}
