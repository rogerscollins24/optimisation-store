import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import { useUser, Task } from '../store';

export default function Records() {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">{t('records')}</h1>
      </div>

      <div className="mt-4 flex overflow-hidden rounded-xl border border-gray-200 bg-white">
        {(['all', 'pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t('noRecordsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredRecords.map((record) => (
              <div key={record.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500 font-mono">{record.taskCode}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status === 'completed' ? t('completed') : t('pending')}
                </span>
              </div>

              <div className="flex gap-4 mb-4">
                <img src={record.image} alt={translateText(record.title)} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{translateText(record.title)}</h3>
                  <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleString()}</p>
                  {record.status === 'pending_debited' && (
                    <p className="text-xs text-rose-600 mt-1">{t('balanceNegativeContinue')}</p>
                  )}
                </div>
              </div>

              {record.isCombo && record.products && record.products.length > 0 && (
                <div className="mb-3 space-y-1">
                  {record.products.map((item) => (
                    <div key={`${record.id}-${item.product_id}`} className="flex justify-between text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                      <span>{translateText(item.product_name)}</span>
                      <span>USDT {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('totalAmount')}</p>
                  <p className="text-sm font-bold text-gray-800">USDT {record.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">{t('commissionLabel')}</p>
                  <p className="text-sm font-bold text-green-600">+USDT {record.commission.toFixed(2)}</p>
                </div>
              </div>

              {record.status !== 'completed' && (
                <Link to="/starting" className="mt-3 inline-block text-sm text-blue-600 underline font-medium">
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
