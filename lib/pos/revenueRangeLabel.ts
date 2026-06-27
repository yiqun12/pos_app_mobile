import type { RevenueDatePreset } from "@/lib/pos/revenueBusinessDay";
import type { TFunction } from "i18next";

const MONTH_ORDER_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function getRevenueRangeLabel(
  preset: RevenueDatePreset,
  t: TFunction,
  referenceDate = new Date()
): string {
  if (preset === "thisMonth") {
    return t(`revenue.monthOrders.${MONTH_ORDER_KEYS[referenceDate.getMonth()]}`);
  }

  if (preset === "lastMonth") {
    return t(
      `revenue.monthOrders.${MONTH_ORDER_KEYS[(referenceDate.getMonth() + 11) % 12]}`
    );
  }

  return t(`revenue.datePreset.${preset}`);
}
