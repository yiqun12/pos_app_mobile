import type { AsyncResult, SeatLayout } from "@/lib/firestore/types";
import { useMemo } from "react";
import { useStore } from "./useStore";

/**
 * Seat layout (positions/sizes only). Live status comes from useTableStatus.
 */
export function useSeats(): AsyncResult<SeatLayout> {
  const { data, loading, error } = useStore();
  return useMemo<AsyncResult<SeatLayout>>(
    () => ({ data: data?.seatLayout ?? null, loading, error }),
    [data, loading, error]
  );
}
