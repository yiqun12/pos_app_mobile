import type { AsyncResult, Menu } from "@/lib/firestore/types";
import { useMemo } from "react";
import { useStore } from "./useStore";

/**
 * Derived menu from the current store document. Reuses useStore's fetch.
 */
export function useMenu(): AsyncResult<Menu> {
  const { data, loading, error } = useStore();
  return useMemo<AsyncResult<Menu>>(
    () => ({ data: data?.menu ?? null, loading, error }),
    [data, loading, error]
  );
}
