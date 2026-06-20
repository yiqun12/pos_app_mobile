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

type OtaBannerInput = {
  status: OtaUpdateStatus;
  dismissed: boolean;
  errorMessage?: string | null;
};

export type OtaUpdateBannerModel =
  | { visible: false }
  | {
      visible: true;
      title: string;
      message: string;
      actionLabel: string;
      loading: boolean;
      canDismiss: boolean;
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

export function getOtaUpdateBannerModel({
  status,
  dismissed,
  errorMessage,
}: OtaBannerInput): OtaUpdateBannerModel {
  if (dismissed) return { visible: false };

  if (status === "available") {
    return {
      visible: true,
      title: "New update available",
      message: "Restart to apply the latest app update.",
      actionLabel: "Update Now",
      loading: false,
      canDismiss: true,
    };
  }

  if (status === "downloading") {
    return {
      visible: true,
      title: "Updating...",
      message: "Downloading the latest app update.",
      actionLabel: "Updating...",
      loading: true,
      canDismiss: false,
    };
  }

  if (status === "error") {
    return {
      visible: true,
      title: "Update failed",
      message: errorMessage || "Check your connection and try again.",
      actionLabel: "Retry",
      loading: false,
      canDismiss: true,
    };
  }

  return { visible: false };
}
