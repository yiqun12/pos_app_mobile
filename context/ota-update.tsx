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
  shouldRunOtaUpdateCheck,
} from "@/lib/updates/otaUpdateState";

const OTA_CHECK_INTERVAL_MS = 60 * 1000;

type OtaUpdateContextValue = {
  status: OtaUpdateStatus;
  errorMessage: string | null;
  checkForUpdate: (force?: boolean) => Promise<void>;
  applyUpdate: () => Promise<void>;
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
      const shouldCheck = shouldRunOtaUpdateCheck({
        force,
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

  useEffect(() => {
    if (!canCheckUpdates) {
      setStatus("disabled");
      return;
    }

    void checkForUpdate(true);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void checkForUpdate(true);
      }
    });

    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        void checkForUpdate(true);
      }
    }, OTA_CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [canCheckUpdates, checkForUpdate]);

  const value = useMemo<OtaUpdateContextValue>(
    () => ({
      status,
      errorMessage,
      checkForUpdate,
      applyUpdate,
    }),
    [status, errorMessage, checkForUpdate, applyUpdate]
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
