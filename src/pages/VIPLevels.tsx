import { useEffect, useMemo, useState } from 'react';
import { Download, Edit2, Save, Shield } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminGetVipLevels, adminUpdateVipLevel, type VipLevelConfig } from '../lib/adminApi';

type VipFormMap = Record<number, VipLevelConfig>;

const vipCardStyles: Record<number, string> = {
  1: 'bg-[#426b82]',
  2: 'bg-[#155fd7]',
  3: 'bg-[#f2a622]',
  4: 'bg-[#7a1fb0]',
};

const levelOrder = [1, 2, 3, 4];

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export default function VIPLevels() {
  const { token, role } = useAdminAuth();
  const isSuperAdmin = role === 'super_admin';

  const [users, setUsers] = useState<any[]>([]);
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>([]);
  const [vipForm, setVipForm] = useState<VipFormMap>({});
  const [loading, setLoading] = useState(true);
  const [savingLevel, setSavingLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedVipLevels = useMemo(() => {
    return [...vipLevels].sort((a, b) => a.level - b.level);
  }, [vipLevels]);

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = await response.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const fetchVipLevels = async () => {
    if (!token) return;
    const data = await adminGetVipLevels(token);
    const normalized = data
      .filter((item) => levelOrder.includes(item.level))
      .sort((a, b) => a.level - b.level);
    setVipLevels(normalized);

    const formData: VipFormMap = {};
    normalized.forEach((item) => {
      formData[item.level] = { ...item };
    });
    setVipForm(formData);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchUsers(), fetchVipLevels()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load VIP levels');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const updateVipFormValue = (level: number, key: keyof Omit<VipLevelConfig, 'level'>, value: string) => {
    setVipForm((current) => {
      const target = current[level];
      if (!target) return current;

      const fallback = Number(target[key]);
      const numericValue = toNumber(value, fallback);
      return {
        ...current,
        [level]: {
          ...target,
          [key]: key === 'tasks_per_set' ? Math.max(1, Math.floor(numericValue)) : Math.max(0, numericValue),
        },
      };
    });
  };

  const saveVipLevel = async (level: number) => {
    if (!token || !isSuperAdmin) return;
    const row = vipForm[level];
    if (!row) return;

    try {
      setSavingLevel(level);
      setError(null);
      await adminUpdateVipLevel(token, level, {
        commission_rate: Math.max(0, row.commission_rate),
        combo_rate: Math.max(0, row.combo_rate),
        activation_amount: Math.max(0, row.activation_amount),
        tasks_per_set: Math.max(1, Math.floor(row.tasks_per_set)),
      });
      await fetchVipLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save VIP ${level}`);
    } finally {
      setSavingLevel(null);
    }
  };

  const handleEditVip = async (user: any) => {
    const level = prompt(`Set VIP level for ${user.username} (1-4):`, String(user.vip_level));
    if (!level) return;
    const vip = Number(level);
    if (Number.isNaN(vip) || vip < 1 || vip > 4) return;

    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
          <h1 className="text-2xl font-bold text-slate-100">VIP Levels Details</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure VIP1-VIP4 commission, combined payout, activation amount, and tasks per set.
          </p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-fit">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">VIP Level Details</h2>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${isSuperAdmin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {isSuperAdmin ? 'Super Admin: Editable' : 'Read Only'}
          </span>
        </div>

        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-400">Loading VIP details...</p> : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {levelOrder.map((level) => {
            const row = vipForm[level];
            if (!row) return null;

            return (
              <div key={level} className={`rounded-xl p-4 text-white ${vipCardStyles[level] || 'bg-slate-700'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-2xl font-bold">VIP{level}</h3>
                  <button
                    type="button"
                    onClick={() => saveVipLevel(level)}
                    disabled={!isSuperAdmin || savingLevel === level}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingLevel === level ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-white/85">Commission (%)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.commission_rate}
                      onChange={(event) => updateVipFormValue(level, 'commission_rate', event.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white disabled:opacity-70"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="mb-1 block text-white/85">Combined Payout (%)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.combo_rate}
                      onChange={(event) => updateVipFormValue(level, 'combo_rate', event.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white disabled:opacity-70"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="mb-1 block text-white/85">Activation Amount (USDT)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.activation_amount}
                      onChange={(event) => updateVipFormValue(level, 'activation_amount', event.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white disabled:opacity-70"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="mb-1 block text-white/85">Tasks Per Set</span>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={row.tasks_per_set}
                      onChange={(event) => updateVipFormValue(level, 'tasks_per_set', event.target.value)}
                      disabled={!isSuperAdmin}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white disabled:opacity-70"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-100">User VIP Assignment</h2>
          <p className="mt-1 text-sm text-slate-400">Assign each client to VIP1-VIP4.</p>
        </div>
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

      <div className="rounded-lg border border-slate-700/40 bg-slate-900/40 p-4 text-xs text-slate-400">
        Loaded levels: {sortedVipLevels.length > 0 ? sortedVipLevels.map((row) => `VIP${row.level}`).join(', ') : 'none'}
      </div>
    </div>
  );
}