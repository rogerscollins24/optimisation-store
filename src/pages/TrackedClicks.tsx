import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function TrackedClicks() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    const res = await fetch('/api/tracked-clicks');
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Username', 'Campaign', 'Clicks', 'Conversions', 'Conversion Rate', 'Last Click'];
    const values = rows.map((r) => [r.id, r.username, r.campaign, r.clicks, r.conversions, `${r.conversion_rate}%`, r.last_click_at]);
    const csv = [headers, ...values]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracked_clicks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Tracked Clicks</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Clicks</th>
                <th className="px-6 py-4 font-medium">Conversions</th>
                <th className="px-6 py-4 font-medium">Conversion Rate</th>
                <th className="px-6 py-4 font-medium">Last Click At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">{row.id}</td>
                  <td className="px-6 py-4 text-slate-200">{row.username}</td>
                  <td className="px-6 py-4">{row.campaign}</td>
                  <td className="px-6 py-4">{row.clicks}</td>
                  <td className="px-6 py-4">{row.conversions}</td>
                  <td className="px-6 py-4">{row.conversion_rate}%</td>
                  <td className="px-6 py-4">{row.last_click_at}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No tracked clicks data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
