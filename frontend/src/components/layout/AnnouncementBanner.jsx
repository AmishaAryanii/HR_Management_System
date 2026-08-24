import { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';
import { HiOutlineSpeakerphone, HiOutlineX } from 'react-icons/hi';

const priorityConfig = {
  urgent: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  high: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  normal: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  low: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await announcementAPI.getAll({ status: 'published', limit: 5 });
        setAnnouncements(res.data.data || []);
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visible = announcements.filter(a => !dismissedIds.has(a.id));

  if (loading || visible.length === 0) return null;

  return (
    <div className="space-y-2 px-4 sm:px-6 lg:px-8 pt-3">
      {visible.map((a) => {
        const cfg = priorityConfig[a.priority] || priorityConfig.normal;
        return (
          <div
            key={a.id}
            className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} animate-fade-in-down`}
          >
            <HiOutlineSpeakerphone className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-semibold ${cfg.text}`}>{a.title}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.badge}`}>
                  {a.priority === 'urgent' ? 'URGENT' : a.priority === 'high' ? 'HIGH' : a.priority?.toUpperCase() || 'NORMAL'}
                </span>
                {a.createdAt && (
                  <span className="text-xs text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${cfg.text} opacity-80 leading-relaxed`}>{a.content}</p>
              {a.creator && (
                <p className="text-xs text-gray-400 mt-1">
                  — {a.creator.firstName} {a.creator.lastName}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className={`p-1 rounded-lg hover:bg-black/5 flex-shrink-0 transition-colors ${cfg.text}`}
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
