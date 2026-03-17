import { useEffect, useState } from 'react';
import { Search, Plus, Target, AlertCircle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';

const initialForm = {
  userId: '',
  taskNumber: '',
  productId: '',
};

export default function Combos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [combosData, setCombosData] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingCombo, setEditingCombo] = useState<any | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchCombos();
    fetchUsers();
    fetchProducts();
  }, []);

  const fetchCombos = async () => {
    const res = await fetch('/api/combos');
    const data = await res.json();
    setCombosData(Array.isArray(data) ? data : []);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  };

  const openCreate = () => {
    setEditingCombo(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (combo: any) => {
    setEditingCombo(combo);
    setFormData({
      userId: String(combo.user_id),
      taskNumber: String(combo.task_number),
      productId: String(combo.product_id),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.userId || !formData.taskNumber || !formData.productId) return;

    const payload = {
      userId: Number(formData.userId),
      taskNumber: Number(formData.taskNumber),
      productId: Number(formData.productId),
    };

    if (editingCombo) {
      await fetch(`/api/combos/${editingCombo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setShowForm(false);
    fetchCombos();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this combo assignment?')) return;
    await fetch(`/api/combos/${id}`, { method: 'DELETE' });
    fetchCombos();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Username', 'Trigger Task', 'Product', 'Price', 'Status', 'Assigned At'];
    const rows = filteredCombos.map((c) => [c.id, c.username, c.task_number, c.product_name, c.price, c.status, c.assigned_at]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCombos = combosData.filter((combo) => {
    const text = `${combo.username} ${combo.product_name} ${combo.task_number}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Combo Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Assign high-value products to specific users on specific tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Export CSV</button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={18} />Assign New Combo</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            {editingCombo ? 'Edit Combo Trigger' : 'Assign Combo Trigger'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target User</label>
              <select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none">
                <option value="">Select User...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Trigger Task Number</label>
              <input type="number" placeholder="e.g. 35" value={formData.taskNumber} onChange={(e) => setFormData({ ...formData, taskNumber: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Combo Product</label>
              <select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none">
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleSave} className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>

          <div className="mt-1 flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>This rule forces a selected product when the user reaches the trigger task number.</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search combos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Target User</th>
                <th className="px-6 py-4 font-medium">Trigger Task #</th>
                <th className="px-6 py-4 font-medium">Combo Product</th>
                <th className="px-6 py-4 font-medium">Product Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Assigned At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredCombos.map((combo) => (
                <tr key={combo.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">#{combo.id}</td>
                  <td className="px-6 py-4 text-slate-200">{combo.username}</td>
                  <td className="px-6 py-4">Task {combo.task_number}</td>
                  <td className="px-6 py-4">{combo.product_name}</td>
                  <td className="px-6 py-4">${combo.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${
                      combo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      combo.status === 'Triggered' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {combo.status === 'Completed' && <CheckCircle2 size={12} />}
                      {combo.status === 'Triggered' && <AlertCircle size={12} />}
                      {combo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{combo.assigned_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(combo)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(combo.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCombos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No combos found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
