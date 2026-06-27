import type { Notification } from "@/components/notifications";
import type { TFunction } from "i18next";

export function buildMockNotifications(t: TFunction): Notification[] {
  return [
    {
      id: "1",
      type: "order",
      title: t("notifications.mock.newOrderReceived.title"),
      message: t("notifications.mock.newOrderReceived.message"),
      timestamp: t("notifications.mock.time.2MinAgo"),
      isRead: false,
      orderId: "A1023",
      amount: 48.5,
    },
    {
      id: "2",
      type: "order",
      title: t("notifications.mock.newDoorDashOrder.title"),
      message: t("notifications.mock.newDoorDashOrder.message"),
      timestamp: t("notifications.mock.time.15MinAgo"),
      isRead: false,
      orderId: "D4521",
      amount: 32.0,
    },
    {
      id: "3",
      type: "payment",
      title: t("notifications.mock.paymentReceived.title"),
      message: t("notifications.mock.paymentReceived.message"),
      timestamp: t("notifications.mock.time.1HourAgo"),
      isRead: true,
      orderId: "A1019",
      amount: 86.75,
    },
    {
      id: "4",
      type: "alert",
      title: t("notifications.mock.lowInventoryAlert.title"),
      message: t("notifications.mock.lowInventoryAlert.message"),
      timestamp: t("notifications.mock.time.2HoursAgo"),
      isRead: true,
    },
    {
      id: "5",
      type: "system",
      title: t("notifications.mock.systemUpdate.title"),
      message: t("notifications.mock.systemUpdate.message"),
      timestamp: t("notifications.mock.time.yesterday"),
      isRead: true,
    },
    {
      id: "6",
      type: "order",
      title: t("notifications.mock.orderCompleted.title"),
      message: t("notifications.mock.orderCompleted.message"),
      timestamp: t("notifications.mock.time.yesterday"),
      isRead: true,
      orderId: "A1015",
    },
  ];
}
