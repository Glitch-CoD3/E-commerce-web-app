'use client';

import { useState, useEffect } from 'react';
import {
  CreateBrandInput,
  Brand,
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../../services/product.service';

type BrandTabProps = {
  brands?: Brand[];
  onSave?: (data: CreateBrandInput, editingId: string | null) => void;
  onDelete?: (id: string | number) => void;
  formSubBg?: string;
  tableHeaderBg?: string;
  inputBg?: string;
  borderRow?: string;
};

export default function BrandTab({
  brands: initialBrands = [],
  onSave,
  onDelete,
  formSubBg = 'transparent',
  tableHeaderBg = 'transparent',
  inputBg = 'transparent',
  borderRow = 'transparent',
}: BrandTabProps) {
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState('');
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);

  // Load brands on component mount
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const fetchedBrands = await getAllBrands();
      setBrands(fetchedBrands.data);
      console.log('Fetched brands:', fetchedBrands.data);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Handle Edit Click
  const handleEditClick = (brand: Brand) => {
    setEditingId(brand.id);
    setBrandName(brand.brand_name);
    setLogo(brand.logo || '');
  };

  // Reset form
  const resetForm = () => {
    setBrandName('');
    setLogo('');
    setEditingId(null);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const payload: CreateBrandInput = {
      brand_name: brandName.trim(),
      logo: logo.trim() || null,
    };

    try {
      if (editingId) {
        await updateBrand(editingId, payload);
      } else {
        await createBrand(payload);
      }

      // Refresh list after saving
      await fetchBrands();

      // Trigger optional parent callback
      if (onSave) {
        onSave(payload, editingId ? String(editingId) : null);
      }

      resetForm();
    } catch (err) {
      console.error('Failed to save brand:', err);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string | number) => {
    try {
      await deleteBrand(id);

      // Refresh list after deletion
      await fetchBrands();

      // Trigger optional parent callback
      if (onDelete) {
        onDelete(String(id));
      }
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
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
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
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
                setBrandName('');
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
            {brands.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-xs text-slate-400">
                  No brands found.
                </td>
              </tr>
            ) : (
              brands.map(brand => (
                <tr key={brand.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                  <td className="p-3 font-bold">{brand.brand_name}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(brand.id);
                        setBrandName(brand.brand_name);
                        setLogo(brand.logo || '');
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