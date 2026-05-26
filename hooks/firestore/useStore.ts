import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { getStore } from "@/lib/firestore/repositories/store";
import type { AsyncResult, Store } from "@/lib/firestore/types";
import { useEffect, useState } from "react";

/**
 * Fetch the current store's full document. One-shot (not realtime).
 */
export function useStore(): AsyncResult<Store> {
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const [state, setState] = useState<AsyncResult<Store>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user || !currentStoreId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    getStore(user.uid, currentStoreId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err as Error });
      });
    return () => {
      cancelled = true;
    };
  }, [user, currentStoreId]);

  return state;
}
