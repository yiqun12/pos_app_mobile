import { serializeMenuForWebKey } from "@/lib/pos/menuTransforms";
import {
  buildGlobalModificationPatch,
  type AppGlobalModification,
} from "@/lib/pos/globalModificationTransforms";
import { stringifyJsonField } from "../serialize";
import { storePath } from "../paths";
import type { Menu } from "@/types/menu";

export function buildMenuKeyPatch(menu: Menu): { key: string } {
  return {
    key: stringifyJsonField(serializeMenuForWebKey(menu)),
  };
}

export async function updateMenu(
  uid: string,
  storeId: string,
  menu: Menu
): Promise<void> {
  const [{ db }, { doc, setDoc }] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/firestore"),
  ]);
  const ref = doc(db, ...storePath(uid, storeId));
  await setDoc(ref, buildMenuKeyPatch(menu), { merge: true });
}

export async function updateGlobalModifications(
  uid: string,
  storeId: string,
  customizations: AppGlobalModification[]
): Promise<void> {
  const [{ db }, { doc, setDoc }] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/firestore"),
  ]);
  const ref = doc(db, ...storePath(uid, storeId));
  await setDoc(ref, buildGlobalModificationPatch(customizations), { merge: true });
}
