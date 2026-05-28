export type RevenueOrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type RevenueOrderSummary = {
  id: string;
  guest: string;
  time: string;
  amount: number;
  channel: string;
  items?: RevenueOrderItem[];
  subtotal: number;
  serviceFee: number;
  tax: number;
  gratuity: number;
  total: number;
  dateTime: string;
  receiptData?: string;
};

export type CashDrawerSummary = {
  orderCount: number;
  cashSales: number;
  cardSales: number;
  unpaid: number;
  otherSales: number;
  total: number;
  averageOrder: number;
};

export type ItemSalesSummary = {
  name: string;
  quantity: number;
  revenue: number;
  averagePrice: number;
};

export type RevenueStatsSummary = {
  totalRevenue: string;
  netSales: string;
  tax: string;
  tips: string;
};

export type RevenueDashboardSummary = {
  stats: RevenueStatsSummary;
  cashDrawer: CashDrawerSummary;
  itemSales: ItemSalesSummary[];
};

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseTimeToDisplay(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  const parts = dateTimeStr.split("-");
  if (parts.length < 6) return dateTimeStr;
  const [, , , hour, min] = parts;
  return `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
}

export function parseReceiptItems(receiptData?: unknown): RevenueOrderItem[] {
  if (typeof receiptData !== "string" || receiptData.length === 0) return [];
  try {
    const rawItems = JSON.parse(receiptData);
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((item) => {
      const price = parseNumber(item.subtotal ?? item.price, 0);
      const quantity = parseNumber(item.quantity, 1);
      return {
        name: item.name || "Untitled",
        quantity,
        price,
        total: parseNumber(item.itemTotalPrice, price * quantity),
      };
    });
  } catch {
    return [];
  }
}

export function transformSuccessPaymentSummary(
  id: string,
  data: Record<string, any>
): RevenueOrderSummary {
  const meta = data.metadata || {};
  const subtotal = parseNumber(meta.subtotal, 0);
  const tax = parseNumber(meta.tax, 0);
  const gratuity = parseNumber(meta.tips, 0);
  const serviceFee = parseNumber(meta.service_fee, 0);
  const total = parseNumber(meta.total, 0);
  const amount = typeof data.amount === "number" ? data.amount / 100 : total;
  const dateTime = data.dateTime || "";

  return {
    id,
    guest: meta.isDine && data.tableNum ? `Table ${data.tableNum}` : "TakeOut",
    time: parseTimeToDisplay(dateTime),
    amount,
    channel: data.powerBy || (meta.isDine ? "Dine-In" : "TakeOut"),
    subtotal,
    serviceFee,
    tax,
    gratuity,
    total,
    dateTime,
    receiptData: data.receiptData,
  };
}

export function summarizeCashDrawer(orders: RevenueOrderSummary[]): CashDrawerSummary {
  const summary: CashDrawerSummary = {
    orderCount: orders.length,
    cashSales: 0,
    cardSales: 0,
    unpaid: 0,
    otherSales: 0,
    total: 0,
    averageOrder: 0,
  };

  orders.forEach((order) => {
    const channel = (order.channel || "").toLowerCase();
    const value = order.total || order.amount || 0;
    summary.total += value;
    if (channel.includes("cash")) summary.cashSales += value;
    else if (channel.includes("unpaid")) summary.unpaid += value;
    else if (channel.includes("card") || channel.includes("pos") || channel.includes("stripe")) {
      summary.cardSales += value;
    } else {
      summary.otherSales += value;
    }
  });

  summary.cashSales = roundMoney(summary.cashSales);
  summary.cardSales = roundMoney(summary.cardSales);
  summary.unpaid = roundMoney(summary.unpaid);
  summary.otherSales = roundMoney(summary.otherSales);
  summary.total = roundMoney(summary.total);
  summary.averageOrder = summary.orderCount > 0
    ? roundMoney(summary.total / summary.orderCount)
    : 0;
  return summary;
}

export function summarizeRevenueStats(
  orders: Array<Partial<Pick<RevenueOrderSummary, "amount" | "subtotal" | "tax" | "gratuity" | "total">>>
): RevenueStatsSummary {
  let totalRevenue = 0;
  let netSales = 0;
  let tax = 0;
  let tips = 0;

  orders.forEach((order) => {
    totalRevenue += order.total ?? order.amount ?? 0;
    netSales += order.subtotal ?? 0;
    tax += order.tax ?? 0;
    tips += order.gratuity ?? 0;
  });

  return {
    totalRevenue: totalRevenue.toFixed(2),
    netSales: netSales.toFixed(2),
    tax: tax.toFixed(2),
    tips: tips.toFixed(2),
  };
}

export function summarizeItemSales(orders: RevenueOrderSummary[]): ItemSalesSummary[] {
  const byName = new Map<string, { quantity: number; revenue: number }>();

  orders.forEach((order) => {
    const items = order.items ?? parseReceiptItems(order.receiptData);
    items.forEach((item) => {
      const existing = byName.get(item.name) ?? { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      byName.set(item.name, existing);
    });
  });

  return Array.from(byName.entries())
    .map(([name, value]) => ({
      name,
      quantity: value.quantity,
      revenue: roundMoney(value.revenue),
      averagePrice: value.quantity > 0 ? roundMoney(value.revenue / value.quantity) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function summarizeRevenueDashboard(
  orders: RevenueOrderSummary[]
): RevenueDashboardSummary {
  return {
    stats: summarizeRevenueStats(orders),
    cashDrawer: summarizeCashDrawer(orders),
    itemSales: summarizeItemSales(orders).slice(0, 20),
  };
}
