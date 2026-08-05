'use client';

import { useState } from 'react';

type Brand = { 
  id: string; 
  name: string; 
};

type BrandTabProps = {
  brands?: Brand[];
  onSave: (name: string, editingId: string | null) => void;
  onDelete: (id: string) => void;
  formSubBg: string;
  tableHeaderBg: string;
  inputBg: string;
  borderRow: string;
};

export default function BrandTab({
  brands = [], // Defensive parameter fallback for safe rendering
  onSave,
  onDelete,
  formSubBg,
  tableHeaderBg,
  inputBg,
  borderRow,
}: BrandTabProps) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Guarantee array type before performing operations
  const safeBrands = Array.isArray(brands) ? brands : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    /* 
    // API SAVE LOGIC (COMMENTED FOR DEMO)
    try {
      if (editingId) {
        await axiosInstance.put(`/brands/${editingId}`, { name });
      } else {
        await axiosInstance.post('/brands', { name });
      }
    } catch (err) {
      console.error('Failed to save brand:', err);
    }
    */

    // Pass data up to parent handler
    onSave(name.trim(), editingId);

    // Reset Form State
    setName('');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    /* 
    // API DELETE LOGIC (COMMENTED FOR DEMO)
    try {
      await axiosInstance.delete(`/brands/${id}`);
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
    */

    onDelete(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Brand Creation & Edit Form */}
      <form onSubmit={handleSubmit} className={`${formSubBg} p-5 rounded-xl border space-y-4 h-fit`}>
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          {editingId ? 'Edit Brand' : 'Add Brand'}
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Brand Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            placeholder="e.g. Sony, Apple, Nike"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition"
          >
            {editingId ? 'Update Brand' : 'Save Brand'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
              }}
              className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-lg font-bold transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Brands Table View */}
      <div className="lg:col-span-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
            <tr>
              <th className="p-3">Brand Name</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {safeBrands.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-xs text-slate-400">
                  No brands found.
                </td>
              </tr>
            ) : (
              safeBrands.map(brand => (
                <tr key={brand.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                  <td className="p-3 font-bold">{brand.name}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(brand.id);
                        setName(brand.name);
                      }}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}