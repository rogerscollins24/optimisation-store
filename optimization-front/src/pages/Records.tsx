import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser, Task } from '../store';

export default function Records() {
  const { user } = useAuth();
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
    return records.filter((record) => activeTab === 'all' || record.status === activeTab);
  }, [activeTab, records]);

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-6">
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm border-b border-gray-100">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Records</h1>
      </div>

      <div className="flex bg-white border-b border-gray-200">
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
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No records found.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500 font-mono">{record.taskCode}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="flex gap-4 mb-4">
                <img src={record.image} alt={record.title} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{record.title}</h3>
                  <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleString()}</p>
                  {record.status === 'pending_debited' && (
                    <p className="text-xs text-rose-600 mt-1">Balance is negative. Deposit and submit this task to continue.</p>
                  )}
                </div>
              </div>

              {record.isCombo && record.products && record.products.length > 0 && (
                <div className="mb-3 space-y-1">
                  {record.products.map((item) => (
                    <div key={`${record.id}-${item.product_id}`} className="flex justify-between text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                      <span>{item.product_name}</span>
                      <span>USDT {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-sm font-bold text-gray-800">USDT {record.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Commission</p>
                  <p className="text-sm font-bold text-green-600">+USDT {record.commission.toFixed(2)}</p>
                </div>
              </div>

              {record.status !== 'completed' && (
                <Link to="/starting" className="mt-3 inline-block text-sm text-blue-600 underline font-medium">
                  Resume Task
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
