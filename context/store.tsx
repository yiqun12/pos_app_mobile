import { useAuth } from "@/context/auth";
import { subscribeStoreList } from "@/lib/firestore/repositories/store";
import type { StoreSummary } from "@/lib/firestore/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@pos:currentStoreId";

interface StoreSelectionContextType {
  storeList: StoreSummary[];
  currentStoreId: string | null;
  setCurrentStoreId: (id: string | null) => Promise<void>;
  reloadStoreList: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const StoreSelectionContext = createContext<StoreSelectionContextType | undefined>(
  undefined
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [storeList, setStoreList] = useState<StoreSummary[]>([]);
  const [currentStoreId, setCurrentStoreIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setCurrentStoreId = useCallback(async (id: string | null) => {
    setCurrentStoreIdState(id);
    if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      setError(null);
      
      const unsub = subscribeStoreList(
        user.uid,
        (list) => {
          setStoreList(list);
          setIsLoading(false);
          
          // Auto select logic based on updated store list
          AsyncStorage.getItem(STORAGE_KEY)
            .then((stored) => {
              if (stored && list.some((s) => s.id === stored)) {
                setCurrentStoreIdState(stored);
              } else if (list.length === 1) {
                setCurrentStoreId(list[0].id);
              } else {
                setCurrentStoreIdState(null);
              }
            })
            .catch(() => {
              if (list.length === 1) {
                setCurrentStoreId(list[0].id);
              }
            });
        },
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );
      
      return unsub;
    } else {
      setStoreList([]);
      setCurrentStoreIdState(null);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, [isAuthenticated, user, setCurrentStoreId]);

  const reloadStoreList = useCallback(async () => {
    // Dummy implementation as updates are realtime
  }, []);

  return (
    <StoreSelectionContext.Provider
      value={{
        storeList,
        currentStoreId,
        setCurrentStoreId,
        reloadStoreList,
        isLoading,
        error,
      }}
    >
      {children}
    </StoreSelectionContext.Provider>
  );
}

export function useStoreSelection() {
  const ctx = useContext(StoreSelectionContext);
  if (!ctx) throw new Error("useStoreSelection must be used within StoreProvider");
  return ctx;
}
