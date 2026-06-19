export const BILLING_RULES = {
  RULE_1: "first_hour_block_then_15min",
  RULE_2: "first_half_hour_block_then_15min",
  RULE_3: "first_hour_block_then_30min",
  RULE_4: "first_hour_block_then_minute",
  RULE_5: "exact_minute",
  RULE_6: "first_40min_30min_or_hour_then_10min",
  CUSTOM_RULE: "custom_rule",
} as const;

export const TABLE_TIMING_CHINESE_KEYWORD = "开台";

export type TableTimingMenuHint = {
  enabled: boolean;
  title: string;
  body: string;
};

export type BillingRuleId = typeof BILLING_RULES[keyof typeof BILLING_RULES];

export type TimerAction = "No Action" | "Auto Checkout" | "Continue Billing";

export type CustomBillingRule = {
  firstBlockDuration: number;
  initialSegmentMinutes: number;
  subsequentSegmentMinutes: number;
};

export type TableTimingTimer = {
  storeId: string;
  tableName: string;
  itemId: string;
  count: string | number;
  action: TimerAction;
  absoluteEndTime: number;
  timerSetAt: number;
  durationMs: number;
  billingRule: BillingRuleId;
  customRule?: CustomBillingRule;
};

export type TableTimingTimerSummary = {
  durationMinutes: number;
  action: TimerAction;
  timerSetAt: number;
  absoluteEndTime: number;
};

export type TableTimingMenuLike = {
  id?: string;
  name?: string;
  CHI?: string;
  rawName?: string;
  nameCN?: string;
  subtotal?: string | number;
  price?: string | number;
  image?: string;
  imageUrl?: string;
  availability?: boolean | string | string[];
  attributesArr?: Record<string, unknown>;
};

export type TableTimingProduct = Record<string, any> & {
  id: string;
  name: string;
  subtotal: string;
  quantity: number;
  attributeSelected: Record<string, string | string[]>;
  count: string | number;
  itemTotalPrice: number;
  CHI?: string;
  isTableItem?: boolean;
  tableRemarks?: string;
  tableTimingStartedAt?: number;
  tableTimingEndedAt?: number;
  tableTimingBasePrice?: number;
  tableTimingBillingRule?: BillingRuleId;
  tableTimingCustomRule?: CustomBillingRule;
  tableTimingTimer?: TableTimingTimerSummary;
};

export function roundTimingMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getTableTimingElapsedMinutes(startedAt: number | null | undefined, now = Date.now()): number {
  if (!startedAt || !Number.isFinite(startedAt)) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 60000));
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function calculateTableTimingFee({
  totalMinutes,
  hourlyRate,
  ruleId,
  customRule,
}: {
  totalMinutes: number;
  hourlyRate: number;
  ruleId: BillingRuleId;
  customRule?: CustomBillingRule;
}): number {
  const minsElapsed = Math.max(0, totalMinutes);
  const rate = Math.max(0, hourlyRate);
  if (rate === 0) return 0;

  let price = 0;
  switch (ruleId) {
    case BILLING_RULES.RULE_1:
      price = minsElapsed <= 60
        ? rate
        : rate + Math.ceil((minsElapsed - 60) / 15) * (rate / 4);
      break;
    case BILLING_RULES.RULE_2:
      if (minsElapsed <= 30) price = rate / 2;
      else if (minsElapsed <= 60) price = rate;
      else price = rate + Math.ceil((minsElapsed - 60) / 15) * (rate / 4);
      break;
    case BILLING_RULES.RULE_3:
      price = minsElapsed <= 60
        ? rate
        : rate + Math.ceil((minsElapsed - 60) / 30) * (rate / 2);
      break;
    case BILLING_RULES.RULE_4:
      price = minsElapsed <= 60
        ? rate
        : rate + (minsElapsed - 60) * (rate / 60);
      break;
    case BILLING_RULES.RULE_5:
      price = minsElapsed * (rate / 60);
      break;
    case BILLING_RULES.RULE_6:
      if (minsElapsed <= 0) price = 0;
      else if (minsElapsed <= 40) price = (30 / 60) * rate;
      else if (minsElapsed <= 60) price = rate;
      else price = rate + Math.ceil((minsElapsed - 60) / 10) * (rate / 6);
      break;
    case BILLING_RULES.CUSTOM_RULE: {
      if (!customRule) return 0;
      const firstBlock = Number(customRule.firstBlockDuration);
      const initialSegment = Number(customRule.initialSegmentMinutes);
      const subsequentSegment = Number(customRule.subsequentSegmentMinutes);
      if (
        !(firstBlock === 30 || firstBlock === 60)
        || initialSegment <= 0
        || subsequentSegment <= 0
      ) {
        return 0;
      }

      const firstBlockPrice = (firstBlock / 60) * rate;
      if (minsElapsed <= 0) price = 0;
      else if (minsElapsed <= firstBlock) {
        const billedMinutes = Math.ceil(minsElapsed / initialSegment) * initialSegment;
        price = billedMinutes >= firstBlock ? firstBlockPrice : (billedMinutes / 60) * rate;
      } else {
        const remainingMinutes = minsElapsed - firstBlock;
        price = firstBlockPrice
          + Math.ceil(remainingMinutes / subsequentSegment) * (subsequentSegment / 60) * rate;
      }
      break;
    }
    default:
      price = minsElapsed * (rate / 60);
  }

  return roundTimingMoney(Math.max(0, price));
}

export function getTableTimingBasePrice(item: TableTimingMenuLike | Record<string, any> | null | undefined): number {
  const source = item as Record<string, any> | null | undefined;
  const raw = source?.tableTimingBasePrice ?? source?.subtotal ?? source?.price;
  return Math.max(parseMoney(raw), 1);
}

export function isTableTimingMenuItem(item: TableTimingMenuLike | null | undefined): boolean {
  if (!item) return false;
  const source = item as Record<string, any>;
  const webChineseName = source.CHI ?? source.nameCN;
  return typeof webChineseName === "string" && webChineseName.includes(TABLE_TIMING_CHINESE_KEYWORD);
}

export function getTableTimingMenuHint(nameCN: string | null | undefined): TableTimingMenuHint {
  const enabled = isTableTimingMenuItem({ nameCN: nameCN ?? "" });
  return enabled
    ? {
        enabled,
        title: "Table Timing Enabled",
        body: "This item will open the table timing modal from POS.",
      }
    : {
        enabled,
        title: "Table Timing Hint",
        body: `Add ${TABLE_TIMING_CHINESE_KEYWORD} to Chinese Name to make this item open the table timing modal.`,
      };
}

export function getTableTimingStartTimestamp(product: Record<string, any>): number | null {
  const values = product.attributeSelected?.["开台商品"];
  const items = Array.isArray(values) ? values : typeof values === "string" ? [values] : [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    if (!item.startsWith("开台时间-")) continue;
    const timestamp = Number(item.replace("开台时间-", ""));
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return typeof product.tableTimingStartedAt === "number" ? product.tableTimingStartedAt : null;
}

function formatTableTimingStartValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("开台时间-")) return value;
  const timestamp = Number(value.replace("开台时间-", ""));
  if (!Number.isFinite(timestamp)) return value;
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `开台时间: ${hours}:${minutes}`;
}

export function formatTableTimingCartAttributes(
  attributeSelected: Record<string, unknown> | null | undefined
): string {
  if (!attributeSelected || typeof attributeSelected !== "object") return "";
  return Object.entries(attributeSelected)
    .map(([key, value]) => {
      if (key === "开台商品") {
        const values = Array.isArray(value) ? value : [value];
        const firstValue = values[0];
        return formatTableTimingStartValue(firstValue) ?? "";
      }
      if (Array.isArray(value)) return value.join(" ");
      return typeof value === "string" ? value : "";
    })
    .filter((value) => value.trim().length > 0)
    .join(" ");
}

export function isActiveTableTimingProduct(product: Record<string, any> | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.isTableItem || product.attributeSelected?.["开台商品"])
    && getTableTimingStartTimestamp(product) !== null
    && !product.tableTimingEndedAt;
}

export function createTableTimingProduct({
  menuItem,
  count = Date.now(),
  startedAt = Date.now(),
  remarks = "",
  billingRule = BILLING_RULES.RULE_6,
  customRule,
}: {
  menuItem: TableTimingMenuLike;
  count?: string | number;
  startedAt?: number;
  remarks?: string;
  billingRule?: BillingRuleId;
  customRule?: CustomBillingRule;
}): TableTimingProduct {
  const hourlyRate = getTableTimingBasePrice(menuItem);
  const attributeSelected: Record<string, string | string[]> = {
    "开台商品": [`开台时间-${startedAt}`],
  };
  if (remarks.trim().length > 0) {
    attributeSelected["备注"] = [remarks.trim()];
  }

  return {
    attributesArr: menuItem.attributesArr ?? {},
    availability: menuItem.availability ?? true,
    id: String(menuItem.id ?? count),
    name: menuItem.rawName ?? menuItem.name ?? "Table Timing",
    subtotal: hourlyRate.toFixed(2),
    image: menuItem.imageUrl ?? menuItem.image ?? "",
    quantity: 1,
    attributeSelected,
    count,
    itemTotalPrice: roundTimingMoney(hourlyRate),
    CHI: menuItem.nameCN ?? menuItem.CHI,
    isTableItem: true,
    tableRemarks: remarks,
    tableTimingStartedAt: startedAt,
    tableTimingBasePrice: hourlyRate,
    tableTimingBillingRule: billingRule,
    tableTimingCustomRule: customRule,
  };
}

export function endTableTimingProduct({
  product,
  endedAt = Date.now(),
  finalFee,
}: {
  product: TableTimingProduct | Record<string, any>;
  endedAt?: number;
  finalFee: number;
}): TableTimingProduct {
  const fee = roundTimingMoney(Math.max(0, finalFee));
  return {
    ...product,
    subtotal: fee.toFixed(2),
    itemTotalPrice: roundTimingMoney(fee * (product.quantity ?? 1)),
    tableTimingEndedAt: endedAt,
  } as TableTimingProduct;
}

export function buildTableTimingTimerKey({
  storeId,
  tableName,
  itemId,
  count,
}: Pick<TableTimingTimer, "storeId" | "tableName" | "itemId" | "count">): string {
  return `tableTiming:${storeId}:${tableName}:${itemId}:${count}`;
}

export function getExpiredTableTimingTimers<T extends Pick<TableTimingTimer, "absoluteEndTime">>(
  timers: T[],
  now = Date.now()
): T[] {
  return timers.filter((timer) => timer.absoluteEndTime <= now);
}
