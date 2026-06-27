import assert from "node:assert/strict";
import test from "node:test";

import {
  getRevenueWindowForPreset,
  iterateCalendarDaysInRevenueWindow,
} from "../lib/pos/revenueBusinessDay.ts";
import {
  parseReceiptItems,
  summarizeCashDrawer,
  summarizeDailyRevenue,
  summarizeItemSales,
  transformSuccessPaymentSummary,
} from "../lib/pos/revenueTransforms.ts";

test("transforms success_payment summary without parsing receipt data", () => {
  const order = transformSuccessPaymentSummary("doc-1", {
    amount: 1250,
    powerBy: "Paid by Cash",
    tableNum: "A1",
    dateTime: "2026-05-27-12-34-00-00",
    receiptData: "[bad json",
    metadata: {
      isDine: true,
      subtotal: "10",
      tax: "0.89",
      tips: "1",
      service_fee: "0.61",
      total: "12.5",
    },
  });

  assert.equal(order.id, "doc-1");
  assert.equal(order.guest, "Table A1");
  assert.equal(order.channel, "Paid by Cash");
  assert.equal(order.total, 12.5);
  assert.equal(order.receiptData, "[bad json");
  assert.equal(order.items, undefined);
});

test("parses receipt items lazily", () => {
  const items = parseReceiptItems(
    JSON.stringify([{ name: "Tea", quantity: 2, subtotal: "3.50", itemTotalPrice: 7 }])
  );

  assert.deepEqual(items, [{ name: "Tea", quantity: 2, price: 3.5, total: 7 }]);
});

test("summarizes cash drawer by payment channel", () => {
  const summary = summarizeCashDrawer([
    { id: "1", guest: "", time: "", amount: 10, channel: "Paid by Cash", subtotal: 0, serviceFee: 0, tax: 0, gratuity: 0, total: 10, dateTime: "" },
    { id: "2", guest: "", time: "", amount: 20, channel: "POS Machine", subtotal: 0, serviceFee: 0, tax: 0, gratuity: 0, total: 20, dateTime: "" },
    { id: "3", guest: "", time: "", amount: 5, channel: "Unpaid", subtotal: 0, serviceFee: 0, tax: 0, gratuity: 0, total: 5, dateTime: "" },
  ]);

  assert.equal(summary.cashSales, 10);
  assert.equal(summary.cardSales, 20);
  assert.equal(summary.unpaid, 5);
  assert.equal(summary.total, 35);
  assert.equal(summary.averageOrder, 11.67);
});

test("summarizes item sales from lazy receipt data", () => {
  const items = summarizeItemSales([
    {
      id: "1",
      guest: "",
      time: "",
      amount: 10,
      channel: "Paid by Cash",
      subtotal: 0,
      serviceFee: 0,
      tax: 0,
      gratuity: 0,
      total: 10,
      dateTime: "",
      receiptData: JSON.stringify([
        { name: "Tea", quantity: 2, subtotal: "3", itemTotalPrice: 6 },
        { name: "Noodles", quantity: 1, subtotal: "8", itemTotalPrice: 8 },
      ]),
    },
    {
      id: "2",
      guest: "",
      time: "",
      amount: 3,
      channel: "Paid by Cash",
      subtotal: 0,
      serviceFee: 0,
      tax: 0,
      gratuity: 0,
      total: 3,
      dateTime: "",
      receiptData: JSON.stringify([{ name: "Tea", quantity: 1, subtotal: "3", itemTotalPrice: 3 }]),
    },
  ]);

  assert.deepEqual(items, [
    { name: "Tea", quantity: 3, revenue: 9, averagePrice: 3 },
    { name: "Noodles", quantity: 1, revenue: 8, averagePrice: 8 },
  ]);
});

test("fills every day in selected range for daily revenue chart", () => {
  const timeZone = "America/Los_Angeles";
  const now = new Date("2025-06-25T20:00:00Z");
  const window = getRevenueWindowForPreset("thisMonth", timeZone, now);
  const days = iterateCalendarDaysInRevenueWindow(window, timeZone);

  const daily = summarizeDailyRevenue(
    [
      {
        id: "1",
        guest: "",
        time: "",
        amount: 100,
        channel: "Paid by Cash",
        subtotal: 0,
        serviceFee: 0,
        tax: 0,
        gratuity: 0,
        total: 100,
        dateTime: "2025-06-24-18-00-00-00",
      },
    ],
    window,
    timeZone
  );

  assert.equal(daily.length, days.length);
  assert.equal(daily.filter((point) => point.revenue > 0).length, 1);
  assert.equal(daily.find((point) => point.date === "6/24")?.revenue, 100);
  assert.equal(daily[0].date, "6/1");
  assert.equal(daily[daily.length - 1].date, "6/30");
});
