import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Updates from "expo-updates";
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import {
  OtaUpdateStatus,
  canUseOtaUpdates,
  shouldCheckForOtaUpdate,
} from "@/lib/updates/otaUpdateState";

const OTA_CHECK_INTERVAL_MS = 30 * 60 * 1000;

type OtaUpdateContextValue = {
  status: OtaUpdateStatus;
  dismissed: boolean;
  errorMessage: string | null;
  checkForUpdate: (force?: boolean) => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismiss: () => void;
};

const OtaUpdateContext = createContext<OtaUpdateContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Check your connection and try again.";
}

function isExpoGoRuntime(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function OtaUpdateProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<OtaUpdateStatus>("idle");
  const [dismissed, setDismissed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusRef = useRef<OtaUpdateStatus>(status);
  const lastCheckedAtRef = useRef<number | null>(null);

  const canCheckUpdates = canUseOtaUpdates({
    isDev: __DEV__,
    platform: Platform.OS,
    isExpoGo: isExpoGoRuntime(),
    isUpdatesEnabled: Updates.isEnabled,
  });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const checkForUpdate = useCallback(
    async (force = false) => {
      if (!canCheckUpdates) {
        setStatus("disabled");
        return;
      }

      const now = Date.now();
      const shouldCheck =
        force ||
        shouldCheckForOtaUpdate({
          now,
          lastCheckedAt: lastCheckedAtRef.current,
          minIntervalMs: OTA_CHECK_INTERVAL_MS,
          status: statusRef.current,
        });

      if (!shouldCheck) return;

      setErrorMessage(null);
      setStatus("checking");

      try {
        const update = await Updates.checkForUpdateAsync();
        lastCheckedAtRef.current = now;

        if (update.isAvailable) {
          setDismissed(false);
          setStatus("available");
        } else {
          setStatus("idle");
        }
      } catch (error) {
        lastCheckedAtRef.current = now;
        console.warn("OTA update check failed:", error);
        setStatus("idle");
      }
    },
    [canCheckUpdates]
  );

  const applyUpdate = useCallback(async () => {
    if (!canCheckUpdates || statusRef.current === "downloading") return;

    setDismissed(false);
    setErrorMessage(null);
    setStatus("downloading");

    try {
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        await Updates.reloadAsync();
        return;
      }

      setStatus("idle");
    } catch (error) {
      console.warn("OTA update download failed:", error);
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  }, [canCheckUpdates]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (!canCheckUpdates) {
      setStatus("disabled");
      return;
    }

    void checkForUpdate();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void checkForUpdate();
      }
    });

    return () => subscription.remove();
  }, [canCheckUpdates, checkForUpdate]);

  const value = useMemo<OtaUpdateContextValue>(
    () => ({
      status,
      dismissed,
      errorMessage,
      checkForUpdate,
      applyUpdate,
      dismiss,
    }),
    [status, dismissed, errorMessage, checkForUpdate, applyUpdate, dismiss]
  );

  return (
    <OtaUpdateContext.Provider value={value}>
      {children}
    </OtaUpdateContext.Provider>
  );
}

export function useOtaUpdate() {
  const context = useContext(OtaUpdateContext);

  if (!context) {
    throw new Error("useOtaUpdate must be used within OtaUpdateProvider");
  }

  return context;
}
