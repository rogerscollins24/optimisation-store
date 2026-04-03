import { useState, useEffect } from 'react';
import { Search, Download, Check, X, Eye } from 'lucide-react';

export default function Withdrawals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [withdrawalsData, setWithdrawalsData] = useState<any[]>([]);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/withdrawals');
    const data = await res.json();
    setWithdrawalsData(data);
  };

  const handleApprove = async (id: number) => {
    await fetch(`/api/withdrawals/${id}/approve`, { method: 'POST' });
    fetchWithdrawals();
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/withdrawals/${id}/reject`, { method: 'POST' });
    fetchWithdrawals();
  };

  const exportCSV = () => {
    const headers = ['ID', 'User', 'Amount', 'Method', 'Address', 'Status', 'Date'];
    const csvData = withdrawalsData.map(w => `${w.id},${w.username},${w.amount},${w.method},${w.address},${w.status},${w.created_at}`).join('\n');
    const blob = new Blob([headers.join(',') + '\n' + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = Array.isArray(withdrawalsData) ? withdrawalsData.filter(w => w.status === activeTab && (w.username?.includes(searchTerm) || w.id?.toString().includes(searchTerm))) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Withdrawal Requests</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and approve user withdrawal requests.</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            {['Pending', 'Approved', 'Rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-slate-700 text-slate-100 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by user or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Request ID</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method & Address</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No {activeTab.toLowerCase()} withdrawals found.
                  </td>
                </tr>
              ) : (
                filteredData.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-300">{withdrawal.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{withdrawal.username}</td>
                    <td className="px-6 py-4 font-medium text-emerald-400">${withdrawal.amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">{withdrawal.method}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{withdrawal.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{withdrawal.created_at}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                        {activeTab === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(withdrawal.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" 
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(withdrawal.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors" 
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
