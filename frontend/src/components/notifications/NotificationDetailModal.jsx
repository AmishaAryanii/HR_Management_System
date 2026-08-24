import { getTypeMeta, formatRelativeTime } from './NotificationUtils';

export default function NotificationDetailModal({ notification, onClose }) {
  if (!notification) return null;
  const meta = getTypeMeta(notification.type);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.color}`} />
            <span className="text-xs font-medium text-slate-500">{meta.label}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{notification.title}</h2>
          <p className="text-sm text-slate-500 mt-1">{formatRelativeTime(notification.createdAt)}</p>
          <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{notification.message}</p>

          {notification.actionUrl && (
            <a href={notification.actionUrl} className="inline-block mt-4 text-sm font-medium text-blue-600 hover:underline">
              Open related item →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}