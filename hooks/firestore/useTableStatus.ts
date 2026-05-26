import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { subscribeTableStatus } from "@/lib/firestore/repositories/seats";
import type { AsyncResult, TableStatus } from "@/lib/firestore/types";
import { useEffect, useState } from "react";

/**
 * Realtime subscription to the Table sub-collection.
 */
export function useTableStatus(): AsyncResult<TableStatus[]> {
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const [state, setState] = useState<AsyncResult<TableStatus[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user || !currentStoreId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribeTableStatus(
      user.uid,
      currentStoreId,
      (rows) => setState({ data: rows, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err })
    );
    return unsub;
  }, [user, currentStoreId]);

  return state;
}
