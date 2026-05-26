import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { subscribeStore } from "@/lib/firestore/repositories/store";
import type { AsyncResult, Store } from "@/lib/firestore/types";
import { useEffect, useState } from "react";

/**
 * Fetch the current store's full document. Real-time subscription.
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
    setState((s) => ({ ...s, loading: true }));
    const unsub = subscribeStore(
      user.uid,
      currentStoreId,
      (data) => {
        setState({ data, loading: false, error: null });
      },
      (err) => {
        setState({ data: null, loading: false, error: err });
      }
    );
    return unsub;
  }, [user, currentStoreId]);

  return state;
}
