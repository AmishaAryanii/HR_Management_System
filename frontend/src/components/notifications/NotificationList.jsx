import { useState } from 'react';
import { useNotifications } from './useNotifications';
import NotificationItem from './NotificationItems';
import NotificationDetailModal from './NotificationDetailModal';

export default function NotificationList() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const { notifications, unreadCount, loading, error, markRead, markAllRead, remove, reload } = useNotifications();

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium text-blue-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'unread'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading && <p className="px-4 py-8 text-sm text-slate-400 text-center">Loading notifications...</p>}

        {!loading && error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-rose-500 mb-2">Couldn't load notifications</p>
            <button onClick={() => reload()} className="text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="px-4 py-10 text-sm text-slate-400 text-center">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        )}

        {!loading &&
          !error &&
          filtered.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleSelect} onDelete={remove} />)}
      </div>

      {selected && <NotificationDetailModal notification={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}