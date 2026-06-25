import { useStoreSelection } from "@/context/store";
import type { AsyncResult, StoreSummary } from "@/lib/firestore/types";

export function useStoreList(): AsyncResult<StoreSummary[]> {
  const { storeList, isLoading, error } = useStoreSelection();
  return { data: storeList, loading: isLoading, error };
}
