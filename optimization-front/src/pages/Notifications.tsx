import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import { formatLocalizedDateTime } from '../lib/dateFormatting';

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
  const { t, i18n } = useTranslation();
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
  const dynamicTexts = useMemo(() => {
    const texts: string[] = [];
    notifications.forEach((item) => {
      if (item.title) texts.push(item.title);
      if (item.message) texts.push(item.message);
      if (item.recipients) texts.push(item.recipients);
    });
    return texts;
  }, [notifications]);
  const { translateText } = useDynamicTranslations(dynamicTexts);
  const locale = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center rounded-xl p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-zinc-300 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-amber-300" />
          <h1 className="text-lg font-bold text-[#f6efe4]">{t('notificationsTitle')}</h1>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="client-card rounded-2xl p-8 text-center text-[#6f5f4c]">
            {t('loadingNotifications')}
          </div>
        ) : !hasNotifications ? (
          <div className="client-card rounded-2xl p-8 text-center text-[#6f5f4c]">
            {t('noActiveNotifications')}
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div key={item.id} className="client-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#3b2f22]">{translateText(item.title)}</h2>
                    <p className="mt-1 text-sm text-[#7a6855]">
                      {item.created_at ? formatLocalizedDateTime(item.created_at, locale) : t('recentlyPosted')}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {item.recipients ? translateText(item.recipients) : t('all')}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#4f4233]">{translateText(item.message)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
