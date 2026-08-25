import { getTypeMeta, formatRelativeTime } from './NotificationUtils';

export default function NotificationItem({ notification, onClick, onDelete, compact = false }) {
  const meta = getTypeMeta(notification.type);

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50 ${
        !notification.isRead ? 'bg-blue-50/60' : 'bg-white'
      }`}
    >
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.isRead ? 'bg-transparent' : meta.color}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${notification.isRead ? 'font-normal text-slate-600' : 'font-semibold text-slate-900'}`}>
            {notification.title}
          </p>
          <span className="text-xs text-slate-400 whitespace-nowrap">{formatRelativeTime(notification.createdAt)}</span>
        </div>
        <p className={`text-sm mt-0.5 text-slate-500 ${compact ? 'line-clamp-2' : ''}`}>{notification.message}</p>
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="text-slate-300 hover:text-rose-500 transition-colors px-1 text-lg leading-none"
          aria-label="Delete notification"
        >
          ×
        </button>
      )}
    </div>
  );
}