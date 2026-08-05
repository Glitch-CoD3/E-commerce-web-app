'use client';

import { useState } from 'react';
import axiosInstance from '@/src/api/axiosInstance';

type VariantImage = { id: string; file?: File; previewUrl: string };
type Variant = { id: string; color: string; size: string; price: number; stock: number; images: VariantImage[] };
type Product = { id: string; name: string; shortDescription: string; description: string; category: string; brand?: string; totalQuantity: number; variants: Variant[] };
type Category = { id: string; name: string };
type Brand = { id: string; name: string };

type ProductTabProps = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  onSave: (productData: any, editingId: string | null) => void;
  onDelete: (id: string) => void;
  formSubBg: string;
  tableHeaderBg: string;
  inputBg: string;
  borderRow: string;
};

export default function ProductTab({
  products,
  categories,
  brands,
  onSave,
  onDelete,
  formSubBg,
  tableHeaderBg,
  inputBg,
  borderRow,
}: ProductTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    brand: '',
    variants: [] as Variant[],
  });

  const [tempVariant, setTempVariant] = useState<{
    color: string;
    size: string;
    price: number;
    stock: number;
    images: VariantImage[];
  }>({ color: '', size: '', price: 0, stock: 0, images: [] });

  const [isUploading, setIsUploading] = useState(false);

  // Handle local image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages: VariantImage[] = files.map(file => ({
      id: Math.random().toString(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setTempVariant(prev => ({ ...prev, images: [...prev.images, newImages] }));
  };

  // Add temporary variant to current product form
  const handleAddVariant = async () => {
    if (!tempVariant.color || !tempVariant.size || tempVariant.price <= 0) {
      alert('Please specify variant color, size, and valid price.');
      return;
    }

    setIsUploading(true);
    let uploadedUrls: string[] = [];

    // Upload selected files if any exist
    const filesToUpload = tempVariant.images.filter(img => img.file).map(img => img.file as File);
    if (filesToUpload.length > 0) {
      try {
        const formData = new FormData();
        filesToUpload.forEach(f => formData.append('images', f));
        const res = await axiosInstance.post<{ urls: string[] }>('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls = res.urls || [];
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    const finalVariantImages = tempVariant.images.map((img, idx) => ({
      id: img.id,
      previewUrl: img.file ? uploadedUrls[idx] || img.previewUrl : img.previewUrl,
    }));

    const newVariant: Variant = {
      id: Math.random().toString(),
      color: tempVariant.color,
      size: tempVariant.size,
      price: Number(tempVariant.price),
      stock: Number(tempVariant.stock),
      images: finalVariantImages,
    };

    setForm(prev => ({ ...prev, variants: [...prev.variants, newVariant] }));
    setTempVariant({ color: '', size: '', price: 0, stock: 0, images: [] });
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.variants.length === 0) {
      alert('Please add at least one variant before saving.');
      return;
    }

    const totalQty = form.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    onSave({ ...form, totalQuantity: totalQty }, editingId);

    // Reset Form
    setForm({ name: '', shortDescription: '', description: '', category: '', brand: '', variants: [] });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Product Creation Form */}
      <form onSubmit={handleSubmit} className={`${formSubBg} p-6 rounded-2xl border space-y-6`}>
        <h3 className="text-base font-extrabold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          {editingId ? 'Edit Product' : 'Add New Product'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="e.g. Wireless Noise-Canceling Headphones"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
            <select
              required
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            >
              <option value="">Select Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={e => setForm({ ...form, shortDescription: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="Brief summary for product cards"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Description</label>
            <textarea
              rows={1}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="Detailed product features and specs"
            />
          </div>
        </div>

        {/* Variant Creation Subsection */}
        <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 space-y-4">
          <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Add Variants</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Color (e.g. Black)"
              value={tempVariant.color}
              onChange={e => setTempVariant({ ...tempVariant, color: e.target.value })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="text"
              placeholder="Size (e.g. XL, 128GB)"
              value={tempVariant.size}
              onChange={e => setTempVariant({ ...tempVariant, size: e.target.value })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="number"
              placeholder="Price ($)"
              value={tempVariant.price || ''}
              onChange={e => setTempVariant({ ...tempVariant, price: Number(e.target.value) })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="number"
              placeholder="Stock Qty"
              value={tempVariant.stock || ''}
              onChange={e => setTempVariant({ ...tempVariant, stock: Number(e.target.value) })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleAddVariant}
            disabled={isUploading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold px-4 py-2 rounded-lg transition"
          >
            {isUploading ? 'Uploading...' : '+ Add Variant Option'}
          </button>

          {/* Render Added Variants */}
          {form.variants.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {form.variants.map((v, idx) => (
                <div key={idx} className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2 rounded-lg flex items-center gap-3">
                  <span><strong>{v.color}</strong> / {v.size} — ${v.price} ({v.stock} in stock)</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) })}
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20">
          Save Product & Inventory
        </button>
      </form>

      {/* Products Display Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Variants</th>
              <th className="p-3">Total Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {products.map(p => (
              <tr key={p.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                <td className="p-3 font-bold">{p.name}</td>
                <td className="p-3 text-xs text-slate-400">{p.category || '—'}</td>
                <td className="p-3 text-xs text-slate-400">{p.brand || '—'}</td>
                <td className="p-3 text-xs font-mono text-indigo-400">{p.variants?.length || 0} Option(s)</td>
                <td className="p-3 font-bold">{p.totalQuantity}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setForm({
                        name: p.name,
                        shortDescription: p.shortDescription || '',
                        description: p.description || '',
                        category: p.category || '',
                        brand: p.brand || '',
                        variants: p.variants || [],
                      });
                    }}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => onDelete(p.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}