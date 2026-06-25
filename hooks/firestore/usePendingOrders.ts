import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { subscribePendingOrders } from "@/lib/firestore/repositories/orders";
import type { AsyncResult, PendingOrder } from "@/lib/firestore/types";
import { useEffect, useState } from "react";

/**
 * Realtime pending dine-in orders.
 */
export function usePendingOrders(): AsyncResult<PendingOrder[]> {
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const [state, setState] = useState<AsyncResult<PendingOrder[]>>({
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
    const unsub = subscribePendingOrders(
      user.uid,
      currentStoreId,
      (rows) => setState({ data: rows, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err })
    );
    return unsub;
  }, [user, currentStoreId]);

  return state;
}
