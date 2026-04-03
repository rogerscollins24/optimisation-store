import { useEffect, useState } from 'react';
import { Edit2, Shield, Download } from 'lucide-react';

export default function VIPLevels() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const handleEditVip = async (user: any) => {
    const level = prompt(`Set VIP level for ${user.username} (1-5):`, String(user.vip_level));
    if (!level) return;
    const vip = Number(level);
    if (Number.isNaN(vip) || vip < 1 || vip > 5) return;

    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vip_level: vip }),
    });
    fetchUsers();
  };

  const exportCSV = () => {
    const headers = ['User ID', 'Username', 'Phone', 'VIP Level', 'Status'];
    const rows = users.map((u) => [u.id, u.username, u.phone, u.vip_level, u.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vip_levels_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">VIP Levels Configuration</h1>
          <p className="text-sm text-slate-400 mt-1">Manage user tiers and status by editing each account.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/80 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">VIP Level</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-amber-400" />
                      <span className="font-bold text-slate-200">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{u.phone}</td>
                  <td className="px-6 py-4 font-medium text-emerald-400">VIP {u.vip_level}</td>
                  <td className="px-6 py-4 text-slate-300">{u.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditVip(u)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Edit VIP Level">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
