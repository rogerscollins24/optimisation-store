import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  status?: string;
  recipients?: string;
  created_at?: string;
};

export default function Notifications() {
  const { markNotificationsRead } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json().catch(() => []);
        const activeItems = (Array.isArray(data) ? data : [])
          .filter((item) => String(item?.status ?? 'Active').toLowerCase() === 'active')
          .sort((a, b) => String(b?.created_at ?? '').localeCompare(String(a?.created_at ?? '')));
        setNotifications(activeItems);
        markNotificationsRead(activeItems.map((item) => Number(item.id)).filter((id) => Number.isFinite(id)));
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [markNotificationsRead]);

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications]);

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-amber-500" />
          <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading notifications...
          </div>
        ) : !hasNotifications ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            No active notifications from admin right now.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently posted'}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {item.recipients || 'all'}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
