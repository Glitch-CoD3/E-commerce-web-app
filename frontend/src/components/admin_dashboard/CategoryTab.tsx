'use client';

import { useState } from 'react';
import AxiosInstance from '@/src/api/axiosInstance';

type Category = { id: string; name: string; parentId?: string };

type CategoryTabProps = {
  categories: Category[];
  onSave: (data: { name: string; parentId: string }, id: string | null) => void;
  onDelete: (id: string) => void;
  formSubBg: string;
  tableHeaderBg: string;
  inputBg: string;
  borderRow: string;
};

export default function CategoryTab({ categories, onSave, onDelete, formSubBg, tableHeaderBg, inputBg, borderRow }: CategoryTabProps) {
  const [form, setForm] = useState({ name: '', parentId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await AxiosInstance.put(`/categories/${editingId}`, form);
      } else {
        await AxiosInstance.post('/categories', form);
      }

      onSave(form, editingId);
      setForm({ name: '', parentId: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className={`${formSubBg} p-5 rounded-xl border space-y-4 h-fit`}>
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          {editingId ? 'Edit Category' : 'Add Category'}
        </h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Category Name</label>
          <input
            type="text"
            required
            disabled={loading}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Category</label>
          <select
            value={form.parentId}
            disabled={loading}
            onChange={e => setForm({ ...form, parentId: e.target.value })}
            className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          >
            <option value="">None (Top-Level)</option>
            {categories.filter(c => c.id !== editingId).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          {loading ? 'Saving...' : 'Save Category'}
        </button>
      </form>

      <div className="lg:col-span-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
            <tr>
              <th className="p-3">Category Name</th>
              <th className="p-3">Parent Category</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {categories.map(c => {
              const parent = categories.find(p => p.id === c.parentId);
              return (
                <tr key={c.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 text-xs text-slate-400">{parent ? `↳ ${parent.name}` : '—'}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => { setEditingId(c.id); setForm({ name: c.name, parentId: c.parentId || '' }); }} className="text-xs text-indigo-400 hover:underline">Edit</button>
                    <button onClick={() => onDelete(c.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}