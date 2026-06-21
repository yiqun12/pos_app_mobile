export type OtaUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "error"
  | "disabled";

type OtaCapabilityInput = {
  isDev: boolean;
  platform: string;
  isExpoGo: boolean;
  isUpdatesEnabled: boolean;
};

type OtaCheckInput = {
  now: number;
  lastCheckedAt: number | null;
  minIntervalMs: number;
  status: OtaUpdateStatus;
};

type OtaPromptInput = {
  status: OtaUpdateStatus;
  errorMessage?: string | null;
};

export type OtaUpdatePromptModel =
  | { visible: false }
  | {
      visible: true;
      title: string;
      message: string;
      actionLabel: string;
      loading: boolean;
    };

export function canUseOtaUpdates({
  isDev,
  platform,
  isExpoGo,
  isUpdatesEnabled,
}: OtaCapabilityInput): boolean {
  return !isDev && platform !== "web" && !isExpoGo && isUpdatesEnabled;
}

export function shouldCheckForOtaUpdate({
  now,
  lastCheckedAt,
  minIntervalMs,
  status,
}: OtaCheckInput): boolean {
  if (status === "checking" || status === "downloading") return false;
  if (lastCheckedAt === null) return true;
  return now - lastCheckedAt >= minIntervalMs;
}

export function getOtaUpdatePromptModel({
  status,
  errorMessage,
}: OtaPromptInput): OtaUpdatePromptModel {
  if (status === "available") {
    return {
      visible: true,
      title: "Update required",
      message: "A new version is available. Update now to continue using the app.",
      actionLabel: "Update Now",
      loading: false,
    };
  }

  if (status === "downloading") {
    return {
      visible: true,
      title: "Updating...",
      message: "Downloading the latest version.",
      actionLabel: "Updating...",
      loading: true,
    };
  }

  if (status === "error") {
    return {
      visible: true,
      title: "Update failed",
      message: errorMessage || "Check your connection and try again.",
      actionLabel: "Retry Update",
      loading: false,
    };
  }

  return { visible: false };
}
