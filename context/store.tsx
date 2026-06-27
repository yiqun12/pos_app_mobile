import { useAuth } from "@/context/auth";
import { createStore, subscribeStoreList } from "@/lib/firestore/repositories/store";
import type { StoreSummary } from "@/lib/firestore/types";
import { GUEST_DEFAULT_STORE_INPUT } from "@/lib/pos/createStoreDefaults";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const guestStoreBootstrapRef = useRef(false);

  const setCurrentStoreId = useCallback(async (id: string | null) => {
    setCurrentStoreIdState(id);
    if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const applyStoreSelection = useCallback(
    (list: StoreSummary[]) => {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          if (stored && list.some((s) => s.id === stored)) {
            setCurrentStoreIdState(stored);
          } else if (list.length === 1) {
            void setCurrentStoreId(list[0].id);
          } else {
            setCurrentStoreIdState(null);
          }
        })
        .catch(() => {
          if (list.length === 1) {
            void setCurrentStoreId(list[0].id);
          }
        });
    },
    [setCurrentStoreId]
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      setError(null);

      const unsub = subscribeStoreList(
        user.uid,
        (list) => {
          if (
            list.length === 0 &&
            user.isGuest &&
            !guestStoreBootstrapRef.current
          ) {
            guestStoreBootstrapRef.current = true;
            setIsLoading(true);
            void createStore(user.uid, GUEST_DEFAULT_STORE_INPUT, [])
              .then((storeId) => setCurrentStoreId(storeId))
              .catch((err) => {
                guestStoreBootstrapRef.current = false;
                setError(err instanceof Error ? err : new Error(String(err)));
                setStoreList([]);
                setIsLoading(false);
              });
            return;
          }

          setStoreList(list);
          setIsLoading(false);
          applyStoreSelection(list);
        },
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );

      return unsub;
    }

    guestStoreBootstrapRef.current = false;
    setStoreList([]);
    setCurrentStoreIdState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, [isAuthenticated, user, setCurrentStoreId, applyStoreSelection]);

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
