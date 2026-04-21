import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import { formatLocalizedDateTime } from '../lib/dateFormatting';
import { useUser, Task } from '../store';

const DISPLAY = '"Bricolage Grotesque", ui-sans-serif';

export default function Records() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { records, setRecords } = useUser();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/users/${user.id}/task-records`)
      .then((response) => response.json())
      .then((data) => {
        const nextRecords: Task[] = Array.isArray(data)
          ? data.map((record) => ({
              id: String(record.id),
              title: record.product_name,
              image: record.image_url || 'https://picsum.photos/seed/fallback/300/300',
              price: record.amount,
              commission: record.commission,
              status: record.status,
              createdAt: record.created_at,
              taskCode: record.task_code,
              isCombo: !!record.is_combo,
              comboId: record.combo_id ?? null,
              products: Array.isArray(record.products) ? record.products : [],
            }))
          : [];
        setRecords(nextRecords);
      })
      .catch(() => setRecords([]));
  }, [setRecords, user?.id]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (activeTab === 'all') {
        return true;
      }

      if (activeTab === 'pending') {
        return record.status === 'pending' || record.status === 'pending_debited';
      }

      return record.status === 'completed';
    });
  }, [activeTab, records]);

  const dynamicTexts = useMemo(() => {
    const texts: string[] = [];
    records.forEach((record) => {
      if (record.title) texts.push(record.title);
      record.products?.forEach((item) => {
        const name = String(item.product_name || '').trim();
        if (name) texts.push(name);
      });
    });
    return texts;
  }, [records]);

  const { translateText } = useDynamicTranslations(dynamicTexts);
  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const isDark = theme === 'dark';
  const pendingCount = useMemo(
    () => records.filter((record) => record.status === 'pending' || record.status === 'pending_debited').length,
    [records],
  );
  const completedCount = useMemo(() => records.filter((record) => record.status === 'completed').length, [records]);

  return (
    <div className="canvas-texture flex min-h-full flex-col pb-8">
      <div
        className="overflow-hidden rounded-[30px] border p-4 shadow-[0_18px_36px_rgba(28,26,23,0.08)] md:p-5"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, rgba(37,31,24,0.96) 0%, rgba(25,22,18,0.98) 100%)'
            : 'linear-gradient(145deg, rgba(250,248,244,0.97) 0%, rgba(242,236,226,0.98) 100%)',
          borderColor: isDark ? 'rgba(120,103,82,0.35)' : 'rgba(196,178,154,0.35)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)', color: isDark ? '#d4bc94' : '#8a4b12' }}>
              <ChevronLeft size={22} />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em]" style={{ color: isDark ? '#9e9385' : '#9c9288', fontFamily: DISPLAY }}>{t('records')}</p>
              <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: DISPLAY }}>{t('records')}</h1>
            </div>
          </div>
          <div className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)', color: isDark ? '#d4bc94' : '#8a4b12', fontFamily: DISPLAY }}>
            {records.length} {t('all')}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { value: records.length, label: t('all') },
            { value: pendingCount, label: t('pending') },
            { value: completedCount, label: t('completed') },
          ].map((item) => (
            <div key={item.label} className="rounded-[22px] border px-4 py-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)', borderColor: isDark ? 'rgba(120,103,82,0.3)' : 'rgba(196,178,154,0.28)' }}>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: DISPLAY }}>{item.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: isDark ? '#9e9385' : '#9c9288', fontFamily: DISPLAY }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex overflow-hidden rounded-3xl border p-1.5 shadow-sm" style={{ borderColor: isDark ? 'rgba(120,103,82,0.3)' : '#e2d6c7', background: isDark ? 'rgba(33,30,23,0.92)' : 'rgba(250,248,244,0.92)' }}>
        {(['all', 'pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-[18px] py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === tab
                ? 'bg-[#231d17] text-amber-300 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:bg-white/70 dark:hover:bg-zinc-800 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
            style={{ fontFamily: DISPLAY }}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>{t('noRecordsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <div key={record.id} className="rounded-[26px] border p-4 shadow-[0_12px_24px_rgba(28,26,23,0.06)] transition-shadow duration-200 hover:shadow-[0_18px_28px_rgba(28,26,23,0.09)] dark:border-zinc-800 dark:bg-zinc-900" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">{record.taskCode}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  record.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                }`}>
                  {record.status === 'completed' ? t('completed') : t('pending')}
                </span>
              </div>

              <div className="flex gap-4 mb-4">
                <img src={record.image} alt={translateText(record.title)} className="h-18 w-18 object-cover rounded-[18px] bg-stone-100 dark:bg-zinc-800" />
                <div className="flex-1">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-stone-800 dark:text-stone-100">{translateText(record.title)}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{formatLocalizedDateTime(record.createdAt, locale)}</p>
                  {record.status === 'pending_debited' && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{t('balanceNegativeContinue')}</p>
                  )}
                </div>
              </div>

              {record.isCombo && record.products && record.products.length > 0 && (
                <div className="mb-3 space-y-1">
                  {record.products.map((item) => (
                    <div key={`${record.id}-${item.product_id}`} className="flex justify-between rounded-xl px-3 py-2 text-xs text-stone-600 dark:text-stone-300" style={{ background: 'rgba(180,83,9,0.08)' }}>
                      <span>{translateText(item.product_name)}</span>
                      <span>USDT {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t dark:border-zinc-800" style={{ borderColor: 'rgba(196,178,154,0.25)' }}>
                <div>
                  <p className="mb-1 text-xs text-stone-500 dark:text-stone-400">{t('totalAmount')}</p>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-100">USDT {record.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs text-stone-500 dark:text-stone-400">{t('commissionLabel')}</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+USDT {record.commission.toFixed(2)}</p>
                </div>
              </div>

              {record.status !== 'completed' && (
                <Link to="/starting" className="mt-4 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors" style={{ background: 'rgba(180,83,9,0.08)', color: '#8a4b12' }}>
                  {t('resumeTask')}
                </Link>
              )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
