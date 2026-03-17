import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

const initialForm = {
  name: '',
  price: '0',
  commission_rate: '0',
  stock: '0',
  status: 'Active',
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productsData, setProductsData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProductsData(Array.isArray(data) ? data : []);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: String(product.price ?? 0),
      commission_rate: String(product.commission_rate ?? 0),
      stock: String(product.stock ?? 0),
      status: product.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      price: Number(formData.price || '0'),
      commission_rate: Number(formData.commission_rate || '0'),
      stock: Number(formData.stock || '0'),
      status: formData.status,
    };

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const handleView = (product: any) => {
    alert(
      [
        `Name: ${product.name}`,
        `Price: $${product.price}`,
        `Commission: ${product.commission_rate}%`,
        `Stock: ${product.stock}`,
        `Status: ${product.status}`,
      ].join('\n')
    );
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Price', 'Commission Rate', 'Stock', 'Status'];
    const rows = filteredProducts.map((p) => [p.id, p.name, p.price, p.commission_rate, p.stock, p.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProducts = productsData.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? product.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Products Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Export CSV</button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={18} />Add Product</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="number" placeholder="Commission Rate" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <input type="number" placeholder="Stock" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5" />
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 md:col-span-2">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Out of Stock">Out of Stock</option>
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
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-lg p-2 outline-none">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/40 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Commission</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">#{product.id}</td>
                  <td className="px-6 py-4 text-slate-200">{product.name}</td>
                  <td className="px-6 py-4">${product.price}</td>
                  <td className="px-6 py-4">{product.commission_rate}%</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">{product.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleView(product)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" title="View"><Eye size={18} /></button>
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
