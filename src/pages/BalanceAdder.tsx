import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, History } from 'lucide-react';

export default function BalanceAdder() {
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    setLogs(Array.isArray(data) ? data.filter((l: any) => l.action === 'Added Balance' || l.action === 'Deducted Balance') : []);
  };

  const handleSubmit = async () => {
    if (!userId || !amount) return;
    
    await fetch(`/api/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), type: actionType, reason })
    });
    
    setUserId('');
    setAmount('');
    setReason('');
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Balance Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manually add or deduct funds from user accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Adjust Balance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target User</label>
              <select 
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Select User...</option>
                {Array.isArray(users) && users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} (Bal: ${u.balance})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Action Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setActionType('add')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    actionType === 'add' 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle size={16} /> Add
                </button>
                <button 
                  onClick={() => setActionType('deduct')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    actionType === 'deduct' 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                      : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <MinusCircle size={16} /> Deduct
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-slate-500" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Reason / Notes</label>
              <textarea 
                rows={3} 
                placeholder="e.g. Manual deposit via WhatsApp" 
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-slate-500 resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>

            <button 
              onClick={handleSubmit}
              className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors mt-2 ${
                actionType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {actionType === 'add' ? 'Addition' : 'Deduction'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2 bg-slate-800/80">
            <History size={18} className="text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-100">Recent Manual Adjustments</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Admin</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No recent adjustments found.
                    </td>
                  </tr>
                ) : (
                  logs.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">{record.created_at}</td>
                      <td className="px-6 py-4 font-medium text-slate-300">{record.admin}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">{record.target}</td>
                      <td className={`px-6 py-4 font-medium ${record.action === 'Added Balance' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {record.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
