import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

const initialForm = {
  title: '',
  description: '',
  reward: '0',
  type: 'Daily',
  status: 'Active',
};

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasksData(Array.isArray(data) ? data : []);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      reward: String(task.reward ?? 0),
      type: task.type || 'Daily',
      status: task.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;

    const payload = {
      title: formData.title,
      description: formData.description,
      reward: Number(formData.reward || '0'),
      type: formData.type,
      status: formData.status,
    };

    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const handleView = (task: any) => {
    alert([`Title: ${task.title}`, `Type: ${task.type}`, `Reward: $${task.reward}`, `Status: ${task.status}`, `Description: ${task.description}`].join('\n'));
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Type', 'Reward', 'Status', 'Completions'];
    const rows = filteredTasks.map((t) => [t.id, t.title, t.description, t.type, t.reward, t.status, t.completions]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTasks = tasksData.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? task.type === typeFilter : true;
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Tasks Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Export CSV</button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={18} />Create New Task</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 md:col-span-2" />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 md:col-span-2" rows={3} />
              <input type="number" placeholder="Reward" value={formData.reward} onChange={(e) => setFormData({ ...formData, reward: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5">
                <option value="Daily">Daily</option>
                <option value="One-time">One-time</option>
                <option value="Referral">Referral</option>
                <option value="Social">Social</option>
                <option value="Review">Review</option>
              </select>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 md:col-span-2">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" />
          </div>
          <div className="flex items-center gap-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
              <option value="">All Types</option>
              <option value="Daily">Daily</option>
              <option value="One-time">One-time</option>
              <option value="Referral">Referral</option>
              <option value="Social">Social</option>
              <option value="Review">Review</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Reward</th>
                <th className="px-6 py-4 font-medium">Completions</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">#{task.id}</td>
                  <td className="px-6 py-4 text-slate-200">{task.title}</td>
                  <td className="px-6 py-4">{task.type}</td>
                  <td className="px-6 py-4">${task.reward}</td>
                  <td className="px-6 py-4">{task.completions ?? 0}</td>
                  <td className="px-6 py-4">{task.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleView(task)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" title="View"><Eye size={18} /></button>
                      <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
