import type { Notification } from "@/components/notifications";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import {
  confirmAllPendingNotifications,
  confirmPendingNotification,
  subscribePendingNotifications,
} from "@/lib/firestore/repositories/notifications";
import { mapPendingOrdersToNotifications } from "@/lib/notifications/mapPendingOrders";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useTranslation } from "react-i18next";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !currentStoreId) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribePendingNotifications(
      user.uid,
      currentStoreId,
      (orders) => {
        setNotifications(mapPendingOrdersToNotifications(orders, t));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading pending notifications:", err);
        setNotifications([]);
        setLoading(false);
        setError(err);
      }
    );

    return unsubscribe;
  }, [user, currentStoreId, t, i18n.language]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user || !currentStoreId) return;
      await confirmPendingNotification(user.uid, currentStoreId, id);
    },
    [currentStoreId, user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user || !currentStoreId || notifications.length === 0) return;
    await confirmAllPendingNotifications(
      user.uid,
      currentStoreId,
      notifications.map((notification) => notification.id)
    );
  }, [currentStoreId, notifications, user]);

  const clearAll = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const refresh = useCallback(async () => {
    // onSnapshot keeps data live; pull-to-refresh is a no-op beyond UX feedback.
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      clearAll,
      refresh,
    }),
    [clearAll, error, loading, markAllAsRead, markAsRead, notifications, refresh, unreadCount]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
