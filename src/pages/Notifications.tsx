import { useEffect, useMemo, useState } from 'react';
import { Bell, Edit2, Eye, EyeOff, Plus, Search, Trash2, X, Download } from 'lucide-react';

type NotificationForm = {
  title: string;
  message: string;
  status: string;
  recipients: string;
};

const initialForm: NotificationForm = {
  title: '',
  message: '',
  status: 'Active',
  recipients: 'all',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<NotificationForm>(initialForm);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
  };

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return notifications.filter((item) => {
      const haystack = `${item.title} ${item.message} ${item.status} ${item.recipients}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [notifications, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      message: item.message || '',
      status: item.status || 'Active',
      recipients: item.recipients || 'all',
    });
    setShowModal(true);
  };

  const saveNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) return;

    const endpoint = editing ? `/api/notifications/${editing.id}` : '/api/notifications';
    const method = editing ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setShowModal(false);
    fetchNotifications();
  };

  const toggleVisibility = async (item: any) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    await fetch(`/api/notifications/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchNotifications();
  };

  const removeNotification = async (id: number) => {
    if (!confirm('Delete this notification?')) return;
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    fetchNotifications();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Message', 'Status', 'Recipients', 'Created At'];
    const rows = filtered.map((item) => [
      item.id,
      item.title,
      item.message,
      item.status,
      item.recipients,
      item.created_at,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Bell className="text-blue-400" size={22} />Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">Create and manage announcement messages for users.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Plus size={18} />Create Notification
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 w-full sm:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500"
            />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">
            <Download size={16} />Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/40 border-b border-slate-700/50 text-slate-400">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Recipients</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-100">{item.title}</td>
                  <td className="px-6 py-4 max-w-[460px] truncate">{item.message}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border border-slate-500/20'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.recipients}</td>
                  <td className="px-6 py-4">{item.created_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleVisibility(item)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg" title="Toggle Visibility">
                        {item.status === 'Active' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => removeNotification(item.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No notifications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-[1px] flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl mt-8 bg-slate-900 border border-slate-700/80 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-slate-100">{editing ? 'Edit Notification' : 'Create Notification'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-3 outline-none"
              />
              <textarea
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full min-h-28 bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-3 outline-none"
              />
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-3 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input
                type="text"
                placeholder="Recipients (comma-separated usernames or 'all')"
                value={form.recipients}
                onChange={(e) => setForm((prev) => ({ ...prev, recipients: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-3 outline-none"
              />
              <p className="text-slate-300 text-sm">Leave blank or type all to notify everyone. Otherwise, use comma-separated usernames.</p>
            </div>

            <div className="mt-4">
              <button onClick={saveNotification} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
