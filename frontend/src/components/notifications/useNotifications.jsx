import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../../services/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      const data = res.data?.data || [];
      setNotifications(data);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markRead = useCallback(async (id) => {
    await notificationAPI.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationAPI.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    await notificationAPI.delete(id);
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.isRead) {
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
      }
      return updated;
    });
  }, []);

  const reload = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    remove,
    reload,
  };
}

export default useNotifications;
