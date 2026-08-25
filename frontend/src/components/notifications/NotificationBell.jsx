import { useEffect, useRef, useState } from 'react';
import { HiOutlineBell } from 'react-icons/hi';
import { useNotifications } from './useNotifications';
import NotificationItem from './NotificationItems';
import NotificationDetailModal from './NotificationDetailModal';

export default function NotificationBell({ onViewAll }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const panelRef = useRef(null);

  const { notifications, unreadCount, loading, error, markRead, reload } = useNotifications();

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      try {
        await markRead(notification.id);
      } catch {
        // modal still opens even if mark-as-read fails
      }
    }
  };

  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) reload();
        }}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <HiOutlineBell className="w-5.5 h-5.5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-sm text-slate-400 text-center">Loading...</p>}

            {!loading && error && <p className="px-4 py-6 text-sm text-rose-500 text-center">Couldn't load notifications</p>}

            {!loading && !error && recent.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">You're all caught up</p>
            )}

            {!loading &&
              !error &&
              recent.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleSelect} compact />)}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              onViewAll?.();
            }}
            className="w-full text-center text-sm font-medium text-blue-600 hover:bg-slate-50 px-4 py-3 border-t border-slate-100"
          >
            View all notifications
          </button>
        </div>
      )}

      {selected && <NotificationDetailModal notification={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}