import React from 'react';
import { CategoryType, ProductStatus, Brand, ProductFormProps } from '@/src/services/product.service';

export default function ProductForm({
  form,
  setForm,
  categories,
  brands,
  editingId,
  isSaving,
  onSubmit,
  onCancelEdit,
  formSubBg,
  inputBg,
}: ProductFormProps) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`${formSubBg} p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 sm:space-y-6 max-w-full overflow-hidden`}
    >
      {/* Header */}
      <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
        {editingId ? 'Edit Product' : 'Add New Product'}
      </h3>

      {/* Main Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Product Title */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title</label>
          <input
            type="text"
            required
            disabled={isSaving}
            value={form.product_name}
            onChange={e => setForm({ ...form, product_name: e.target.value })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            placeholder="e.g. Casio G-Shock"
          />
        </div>

        {/* Category */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
          <select
            required
            disabled={isSaving}
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          >
            <option value={0}>Select Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
          <select
            disabled={isSaving}
            value={form.brand_id || 0}
            onChange={e => setForm({ ...form, brand_id: Number(e.target.value) || undefined })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          >
            <option value={0}>Select Brand (Optional)</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.brand_name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
          <select
            disabled={isSaving}
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as ProductStatus })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Descriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description</label>
          <input
            type="text"
            disabled={isSaving}
            value={form.short_description}
            onChange={e => setForm({ ...form, short_description: e.target.value })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            placeholder="Short summary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Full Description</label>
          <textarea
            rows={2}
            disabled={isSaving}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none resize-y ${inputBg}`}
            placeholder="Detailed description"
          />
        </div>
      </div>

      {/* Base price/stock - creation mode only */}
      {!editingId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-dashed border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Base Price ($)</label>
            <input
              type="number"
              required
              disabled={isSaving}
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Stock</label>
            <input
              type="number"
              required
              disabled={isSaving}
              value={form.stock_quantity}
              onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
              className={`w-full text-sm sm:text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="0"
            />
          </div>
          <p className="col-span-1 sm:col-span-2 text-[11px] text-slate-500 leading-relaxed">
            This creates a "Standard" variant automatically. You can add more variants, edit them,
            or manage images from the product list below once the product is created.
          </p>
        </div>
      )}

      {/* Buttons / Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
        {editingId && (
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancelEdit}
            className="w-full sm:w-auto px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-3 rounded-xl font-bold transition text-center"
          >
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all text-center"
        >
          {isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}