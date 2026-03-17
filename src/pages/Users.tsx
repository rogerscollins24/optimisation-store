import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Lock } from 'lucide-react';

const initialForm = {
  username: '',
  email: '',
  phone: '',
  balance: '0',
  vip_level: '1',
  status: 'Active',
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState<any[]>([]);
  const [vipFilter, setVipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsersData(Array.isArray(data) ? data : []);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      balance: String(user.balance ?? 0),
      vip_level: String(user.vip_level ?? 1),
      status: user.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.email) return;

    const payload = {
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      balance: Number(formData.balance || '0'),
      vip_level: Number(formData.vip_level || '1'),
      status: formData.status,
    };

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    fetchUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleLockUser = async (id: number) => {
    if (!confirm('Are you sure you want to lock this user?')) return;
    await fetch(`/api/users/${id}/lock`, { method: 'POST' });
    fetchUsers();
  };

  const handleViewUser = (user: any) => {
    alert(
      [
        `Username: ${user.username}`,
        `Email: ${user.email}`,
        `Phone: ${user.phone}`,
        `Balance: $${user.balance}`,
        `VIP: ${user.vip_level}`,
        `Status: ${user.status}`,
      ].join('\n')
    );
  };

  const exportCSV = () => {
    const headers = ['ID', 'Username', 'Email', 'Phone', 'Balance', 'VIP Level', 'Status'];
    const rows = filteredUsers.map((u) => [u.id, u.username, u.email, u.phone, u.balance, u.vip_level, u.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

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
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVip = vipFilter ? String(user.vip_level) === vipFilter : true;
    const matchesStatus = statusFilter ? user.status === statusFilter : true;
    return matchesSearch && matchesVip && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Users Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add New User
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">{editingUser ? 'Edit User' : 'Create User'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="number" placeholder="Balance" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <select value={formData.vip_level} onChange={(e) => setFormData({ ...formData, vip_level: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5">
                <option value="1">VIP 1</option>
                <option value="2">VIP 2</option>
                <option value="3">VIP 3</option>
                <option value="4">VIP 4</option>
                <option value="5">VIP 5</option>
              </select>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200">Cancel</button>
              <button onClick={handleSaveUser} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" />
          </div>
          <div className="flex items-center gap-3">
            <select value={vipFilter} onChange={(e) => setVipFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
              <option value="">All VIP Levels</option>
              <option value="1">VIP 1</option>
              <option value="2">VIP 2</option>
              <option value="3">VIP 3</option>
              <option value="4">VIP 4</option>
              <option value="5">VIP 5</option>
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
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">User Info</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Balance</th>
                <th className="px-6 py-4 font-medium">VIP Level</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-300">#{user.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{user.username}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{user.email}</span>
                      <span className="text-xs text-slate-500">{user.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-emerald-400">${user.balance}</td>
                  <td className="px-6 py-4">VIP {user.vip_level}</td>
                  <td className="px-6 py-4">{user.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewUser(user)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" title="View Details"><Eye size={18} /></button>
                      <button onClick={() => handleLockUser(user.id)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg" title="Lock User"><Lock size={18} /></button>
                      <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg" title="Edit User"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg" title="Delete User"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
