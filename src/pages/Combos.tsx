import { useEffect, useState } from 'react';
import { Search, Plus, Target, AlertCircle, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';

type ComboSlot = {
  productId: string;
  price: string;
  commission: string;
};

const emptySlots: ComboSlot[] = [
  { productId: '', price: '', commission: '' },
  { productId: '', price: '', commission: '' },
];

export default function Combos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [combosData, setCombosData] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingCombo, setEditingCombo] = useState<any | null>(null);
  const [userId, setUserId] = useState('');
  const [taskNumber, setTaskNumber] = useState('');
  const [slots, setSlots] = useState<ComboSlot[]>(emptySlots);
  const [error, setError] = useState('');

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

  const fillSlotFromProduct = (index: number, nextProductId: string) => {
    const selectedProduct = products.find((item) => String(item.id) === nextProductId);
    setSlots((prev) => {
      const clone = [...prev];
      clone[index] = {
        productId: nextProductId,
        price: selectedProduct ? String(selectedProduct.price) : '',
        commission: selectedProduct ? String(selectedProduct.commission_rate) : '',
      };
      return clone;
    });
  };

  const openCreate = () => {
    setEditingCombo(null);
    setUserId('');
    setTaskNumber('');
    setSlots(emptySlots);
    setError('');
    setShowForm(true);
  };

  const openEdit = (combo: any) => {
    const sourceProducts = Array.isArray(combo.products) ? combo.products.slice(0, 2) : [];
    const nextSlots = [0, 1].map((index) => {
      const item = sourceProducts[index];
      return {
        productId: item ? String(item.product_id) : '',
        price: item ? String(item.price) : '',
        commission: item ? String(item.commission) : '',
      };
    });

    setEditingCombo(combo);
    setUserId(String(combo.user_id));
    setTaskNumber(String(combo.task_number));
    setSlots(nextSlots);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!userId || !taskNumber) {
      setError('Username and trigger task number are required.');
      return;
    }

    if (slots.length !== 2 || slots.some((slot) => !slot.productId || !slot.price || !slot.commission)) {
      setError('Combo must contain exactly 2 configured products with price and commission.');
      return;
    }

    const productIds = slots.map((slot) => slot.productId);
    if (new Set(productIds).size !== 2) {
      setError('Please select two different products in the combo.');
      return;
    }

    const payload = {
      userId: Number(userId),
      taskNumber: Number(taskNumber),
      products: slots.map((slot) => ({
        productId: Number(slot.productId),
        price: Number(slot.price),
        commission: Number(slot.commission),
      })),
    };

    const response = await fetch(editingCombo ? `/api/combos/${editingCombo.id}` : '/api/combos', {
      method: editingCombo ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.detail || 'Unable to save combo right now.');
      return;
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
    const headers = ['ID', 'Username', 'Trigger Task', 'Products', 'Total Price', 'Status', 'Assigned At'];
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
          <p className="text-sm text-slate-400 mt-1">Each combo now requires exactly two products with editable price and commission.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Export CSV</button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={18} />Assign New Combo</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-[1px] flex items-start justify-center overflow-y-auto p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-xl p-6 mt-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Target size={20} className="text-blue-400" />
                {editingCombo ? 'Edit Combo Trigger' : 'Assign Combo Trigger'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Target User</label>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none">
                  <option value="">Select User...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Trigger Task Number</label>
                <input type="number" placeholder="e.g. 35" value={taskNumber} onChange={(e) => setTaskNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {slots.map((slot, index) => (
                <div key={index} className="rounded-lg border border-slate-700/70 bg-slate-950/70 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200">Combo Item {index + 1}</h3>
                  <select
                    value={slot.productId}
                    onChange={(e) => fillSlotFromProduct(index, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Price"
                      value={slot.price}
                      onChange={(e) => {
                        const next = [...slots];
                        next[index] = { ...next[index], price: e.target.value };
                        setSlots(next);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Commission"
                      value={slot.commission}
                      onChange={(e) => {
                        const next = [...slots];
                        next[index] = { ...next[index], commission: e.target.value };
                        setSlots(next);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 text-sm rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="mt-1 flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Combo rules require exactly two products. You can edit each product price and commission before saving.</p>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Save Combo</button>
            </div>
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
                <th className="px-6 py-4 font-medium">Combo Products</th>
                <th className="px-6 py-4 font-medium">Total Price</th>
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
