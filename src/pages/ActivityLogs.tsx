import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logsData, setLogsData] = useState<any[]>([]);
  const [criticalOnly, setCriticalOnly] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    setLogsData(Array.isArray(data) ? data : []);
  };

  const filteredLogs = logsData.filter((log) => {
    const text = `${log.admin} ${log.action} ${log.target}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesCritical = criticalOnly
      ? ['Deleted', 'Locked', 'Rejected', 'Approved'].some((word) => String(log.action).includes(word))
      : true;
    return matchesSearch && matchesCritical;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Admin', 'Action', 'Target', 'Details', 'IP'];
    const rows = filteredLogs.map((l) => [l.created_at, l.admin, l.action, l.target, l.details, l.ip]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">System Activity Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Audit trail of all administrative actions for security and compliance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCriticalOnly((v) => !v)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit">
            <Filter size={18} />
            {criticalOnly ? 'All Logs' : 'Critical Only'}
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all w-full sm:w-96">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by admin, action, or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Admin / Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{log.created_at}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{log.admin}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-400">{log.target}</td>
                  <td className="px-6 py-4 text-slate-300">{log.details}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.ip}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
