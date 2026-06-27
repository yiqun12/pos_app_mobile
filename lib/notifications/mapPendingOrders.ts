import type { Notification } from "@/components/notifications";
import type { PendingNotificationOrder } from "@/lib/firestore/types";
import type { TFunction } from "i18next";

function sortPendingNotifications(orders: PendingNotificationOrder[]): PendingNotificationOrder[] {
  return [...orders].sort((a, b) => {
    if (a.status === "Delivery" && b.status !== "Delivery") return -1;
    if (a.status !== "Delivery" && b.status === "Delivery") return 1;
    return (b.dateMs ?? 0) - (a.dateMs ?? 0);
  });
}

export function mapPendingOrdersToNotifications(
  orders: PendingNotificationOrder[],
  t: TFunction
): Notification[] {
  return sortPendingNotifications(orders).map((order) => {
    const tableLabel = order.tableName || t("notifications.pendingOrder.noTable");
    const isPayment = order.status === "Paid";

    return {
      id: order.id,
      type: isPayment ? "payment" : "order",
      title:
        order.status === "Delivery"
          ? t("notifications.pendingOrder.deliveryTitle", {
              id: order.id.slice(0, 4).toUpperCase(),
            })
          : isPayment
            ? t("notifications.pendingOrder.paymentTitle", { table: tableLabel })
            : t("notifications.pendingOrder.title", { table: tableLabel }),
      message: t("notifications.pendingOrder.message", {
        count: order.itemCount,
        status: order.status || "Pending",
        user: order.username || "—",
      }),
      timestamp: order.date || "—",
      isRead: false,
      orderId: order.id,
      tableName: order.tableName || undefined,
      amount: order.amount > 0 ? order.amount : undefined,
    };
  });
}
