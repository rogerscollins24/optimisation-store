import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Lock, X } from 'lucide-react';

const initialForm = {
  username: '',
  phone: '',
  login_password: '',
  withdraw_password: '',
  gender: '',
  balance: '0',
  commission: '0',
  commission_today: '0',
  last_commission_reset: '',
  vip_level: '1',
  invite_code: '',
  referred_by: '',
  current_set: '0',
  task_count_today: '0',
  tasks_completed_in_set: '0',
  set_starting_balance: '0',
  exchange: '',
  wallet_address: '',
  status: 'Active',
};

const inp = 'w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none placeholder-slate-500';
const lbl = 'block text-xs font-medium text-slate-400 mb-1';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState<any[]>([]);
  const [vipFilter, setVipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsersData(Array.isArray(data) ? data : []);
  };

  const set = (key: string, val: string) => setFormData((prev) => ({ ...prev, [key]: val }));

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      phone: user.phone || '',
      login_password: user.login_password || '',
      withdraw_password: user.withdraw_password || '',
      gender: user.gender || '',
      balance: String(user.balance ?? 0),
      commission: String(user.commission ?? 0),
      commission_today: String(user.commission_today ?? 0),
      last_commission_reset: user.last_commission_reset ? String(user.last_commission_reset).slice(0, 10) : '',
      vip_level: String(user.vip_level ?? 1),
      invite_code: user.invite_code || '',
      referred_by: user.referred_by || '',
      current_set: String(user.current_set ?? 0),
      task_count_today: String(user.task_count_today ?? 0),
      tasks_completed_in_set: String(user.tasks_completed_in_set ?? 0),
      set_starting_balance: String(user.set_starting_balance ?? 0),
      exchange: user.exchange || '',
      wallet_address: user.wallet_address || '',
      status: user.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.username) return;
    const payload: any = {
      username: formData.username,
      phone: formData.phone || null,
      login_password: formData.login_password || null,
      withdraw_password: formData.withdraw_password || null,
      gender: formData.gender || null,
      balance: Number(formData.balance),
      commission: Number(formData.commission),
      commission_today: Number(formData.commission_today),
      last_commission_reset: formData.last_commission_reset || null,
      vip_level: Number(formData.vip_level),
      invite_code: formData.invite_code || null,
      referred_by: formData.referred_by || null,
      current_set: Number(formData.current_set),
      task_count_today: Number(formData.task_count_today),
      tasks_completed_in_set: Number(formData.tasks_completed_in_set),
      set_starting_balance: Number(formData.set_starting_balance),
      exchange: formData.exchange || null,
      wallet_address: formData.wallet_address || null,
      status: formData.status,
    };
    if (!editingUser) payload.email = `${formData.username}@placeholder.local`;

    await fetch(editingUser ? `/api/users/${editingUser.id}` : '/api/users', {
      method: editingUser ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowModal(false);
    fetchUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleLockUser = async (id: number) => {
    if (!confirm('Lock this user?')) return;
    await fetch(`/api/users/${id}/lock`, { method: 'POST' });
    fetchUsers();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Username', 'Phone', 'Balance', 'VIP Level', 'Current Set', 'Exchange', 'Wallet', 'Status'];
    const rows = filteredUsers.map((u) => [u.id, u.username, u.phone, u.balance, u.vip_level, u.current_set, u.exchange, u.wallet_address, u.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVip = vipFilter ? String(user.vip_level) === vipFilter : true;
    const matchesStatus = statusFilter ? user.status === statusFilter : true;
    return matchesSearch && matchesVip && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Users Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Export CSV</button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={18} />Add User</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-[1px] flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl mt-8 mb-8 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-2xl font-bold text-slate-100">{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-3">
              <div>
                <label className={lbl}>Username</label>
                <input className={inp} placeholder="Username" value={formData.username} onChange={(e) => set('username', e.target.value)} />
              </div>

              <div>
                <label className={lbl}>Phone</label>
                <input className={inp} placeholder="Phone" value={formData.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Login Password</label>
                  <input type="password" className={inp} placeholder="Login Password" value={formData.login_password} onChange={(e) => set('login_password', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Withdraw Password</label>
                  <input type="password" className={inp} placeholder="Withdraw Password" value={formData.withdraw_password} onChange={(e) => set('withdraw_password', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={lbl}>Gender</label>
                <select className={inp} value={formData.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Balance</label>
                  <input type="number" className={inp} placeholder="0" value={formData.balance} onChange={(e) => set('balance', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Commission</label>
                  <input type="number" className={inp} placeholder="0" value={formData.commission} onChange={(e) => set('commission', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Commission Today</label>
                  <input type="number" className={inp} placeholder="0" value={formData.commission_today} onChange={(e) => set('commission_today', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Last Commission Reset</label>
                  <input type="date" className={inp} value={formData.last_commission_reset} onChange={(e) => set('last_commission_reset', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>VIP Level</label>
                  <input type="number" min={1} max={10} className={inp} value={formData.vip_level} onChange={(e) => set('vip_level', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Invite Code</label>
                  <input className={inp} placeholder="Invite Code" value={formData.invite_code} onChange={(e) => set('invite_code', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Referred By</label>
                  <input className={inp} placeholder="Referred By" value={formData.referred_by} onChange={(e) => set('referred_by', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Current Set</label>
                  <input type="number" className={inp} placeholder="0" value={formData.current_set} onChange={(e) => set('current_set', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Created At (readonly)</label>
                  <input className={`${inp} opacity-50 cursor-not-allowed`} readOnly value={editingUser?.created_at ? String(editingUser.created_at).slice(0, 10) : ''} />
                </div>
                <div>
                  <label className={lbl}>Task Count Today</label>
                  <input type="number" className={inp} placeholder="0" value={formData.task_count_today} onChange={(e) => set('task_count_today', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Tasks Completed In Set</label>
                  <input type="number" className={inp} placeholder="0" value={formData.tasks_completed_in_set} onChange={(e) => set('tasks_completed_in_set', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Set Starting Balance</label>
                  <input type="number" className={inp} placeholder="0" value={formData.set_starting_balance} onChange={(e) => set('set_starting_balance', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={lbl}>Exchange</label>
                <input className={inp} placeholder="Exchange" value={formData.exchange} onChange={(e) => set('exchange', e.target.value)} />
              </div>

              <div>
                <label className={lbl}>Wallet Address</label>
                <input className={inp} placeholder="Wallet Address" value={formData.wallet_address} onChange={(e) => set('wallet_address', e.target.value)} />
              </div>

              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={formData.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2">
                <button onClick={handleSaveUser} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" />
          </div>
          <div className="flex items-center gap-3">
            <select value={vipFilter} onChange={(e) => setVipFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
              <option value="">All VIP</option>
              {[1,2,3,4,5,6,7,8,9,10].map((v) => <option key={v} value={v}>VIP {v}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-4 font-medium">ID</th>
                <th className="px-4 py-4 font-medium">Username</th>
                <th className="px-4 py-4 font-medium">Phone</th>
                <th className="px-4 py-4 font-medium">VIP Level</th>
                <th className="px-4 py-4 font-medium">Balance</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Current Set</th>
                <th className="px-4 py-4 font-medium">Exchange</th>
                <th className="px-4 py-4 font-medium">Wallet Address</th>
                <th className="px-4 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-4 text-slate-300">#{user.id}</td>
                  <td className="px-4 py-4 text-slate-200 font-medium">{user.username}</td>
                  <td className="px-4 py-4">{user.phone || '—'}</td>
                  <td className="px-4 py-4">{user.vip_level}</td>
                  <td className="px-4 py-4 text-emerald-400">${user.balance}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : user.status === 'Suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-4">Set {user.current_set ?? 1}</td>
                  <td className="px-4 py-4">{user.exchange || '—'}</td>
                  <td className="px-4 py-4 max-w-[120px] truncate">{user.wallet_address || '—'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleLockUser(user.id)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg" title="Lock"><Lock size={16} /></button>
                      <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
