import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

/**
 * Route guard. Must be called inside a component that lives inside AuthProvider + StoreProvider.
 */
export function useAuthRedirect() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentStoreId, isLoading: storeLoading } = useStoreSelection();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || storeLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const onSelectStore = segments[0] === "select-store";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)");
      return;
    }
    if (isAuthenticated && inAuthGroup) {
      if (currentStoreId) router.replace("/(tabs)/seats");
      else router.replace("/select-store");
      return;
    }
    if (isAuthenticated && !currentStoreId && !onSelectStore) {
      router.replace("/select-store");
      return;
    }
  }, [
    isAuthenticated,
    authLoading,
    currentStoreId,
    storeLoading,
    segments,
    router,
  ]);
}
