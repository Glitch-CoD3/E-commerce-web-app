'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/src/api/axiosInstance';

import {
  ProductStatus,
  ProductSize,
  CategoryType,
  getCategories,
  getAllProducts,
  getAllBrands,
} from '@/src/services/product.service';

import { compressImage } from '../../services/compressImage';

// --- TYPES ---

export type Brand = {
  id: number;
  name?: string;
  brand_name?: string;
};

export type ProductVariantImage = {
  id: number;
  product_variant_id: number;
  image_url: string;
  sort_order?: number;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  color?: string | null;
  colors?: string | null;
  size?: ProductSize | null;
  sizes?: ProductSize | null;
  price: number | string;
  stock_quantity: number;
  images?: ProductVariantImage[] | null;
};

export type Product = {
  id: number;
  category_id: number | string;
  brand_id?: number | string | null;
  product_name?: string;
  name?: string;
  url_slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number | string;
  stock_quantity: number;
  status: ProductStatus;
  category_name?: string;
  brand_name?: string;
  total_variants?: number;
  colors?: string[];
  sizes?: string[];
  images?: Record<string, string> | ProductVariantImage[] | null;
  variants?: ProductVariant[];
};

type VariantDraft = {
  color: string;
  size: ProductSize | '';
  price: string;
  stock_quantity: string;
};

type ProductTabProps = {
  formSubBg?: string;
  tableHeaderBg?: string;
  inputBg?: string;
  borderRow?: string;
};

const emptyDraft: VariantDraft = { color: '', size: '', price: '', stock_quantity: '' };

const getVariantColor = (v: ProductVariant) => v.color || v.colors || '';
const getVariantSize = (v: ProductVariant) => (v.size || v.sizes || '') as ProductSize | '';

export default function ProductTab({
  formSubBg = 'bg-slate-900',
  tableHeaderBg = 'bg-slate-800',
  inputBg = 'bg-slate-950 text-white border-slate-700',
  borderRow = 'border-slate-800',
}: ProductTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    product_name: '',
    category_id: 0,
    brand_id: 0 as number | undefined,
    short_description: '',
    description: '',
    status: 'active' as ProductStatus,
    price: '' as string,
    stock_quantity: '' as string,
  });

  // --- Variant panel state ---
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<number, ProductVariant[]>>({});
  const [loadingVariantsFor, setLoadingVariantsFor] = useState<number | null>(null);

  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantDraft, setVariantDraft] = useState<VariantDraft>(emptyDraft);
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);

  const [addingVariantFor, setAddingVariantFor] = useState<number | null>(null);
  const [newVariantDraft, setNewVariantDraft] = useState<VariantDraft>(emptyDraft);
  const [creatingVariant, setCreatingVariant] = useState(false);

  const [busyImageKey, setBusyImageKey] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        getAllProducts(),
        getCategories(),
        getAllBrands(),
      ]);

      setProducts(productsRes?.all_products || []);
      setCategories(categoriesRes?.All_categories || []);
      setBrands(brandsRes?.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const generateSlug = (text: string) => {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') + `-${Date.now()}`
    );
  };

  const resetForm = () => {
    setForm({
      product_name: '',
      category_id: 0,
      brand_id: 0,
      short_description: '',
      description: '',
      status: 'active',
      price: '',
      stock_quantity: '',
    });
    setEditingId(null);
  };

  // --- PRODUCT SUBMIT (create / update product-level fields only) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) {
      alert('Please select a product category.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const updatePayload = {
          category_id: Number(form.category_id),
          brand_id: form.brand_id && Number(form.brand_id) > 0 ? Number(form.brand_id) : null,
          product_name: form.product_name,
          url_slug: generateSlug(form.product_name),
          description: form.description || null,
          short_description: form.short_description || null,
          status: form.status,
        };

        await axiosInstance.patch(`/products/${editingId}`, updatePayload);
      } else {
        const basePrice = Number(form.price) || 0;
        const baseStock = Number(form.stock_quantity) || 0;

        const productPayload = {
          category_id: Number(form.category_id),
          brand_id: form.brand_id && Number(form.brand_id) > 0 ? Number(form.brand_id) : null,
          product_name: form.product_name,
          url_slug: generateSlug(form.product_name),
          description: form.description || null,
          short_description: form.short_description || null,
          price: String(basePrice),
          stock_quantity: baseStock,
          status: form.status,
        };

        const productRes = await axiosInstance.post('/products', productPayload);
        const resData = productRes.data || {};
        const createdProductId =
          resData.created_product?.id || resData.product?.id || resData.data?.id || resData.id;

        if (!createdProductId) {
          throw new Error('Could not retrieve created Product ID.');
        }

        // Create a default "Standard" variant so the product has at least one.
        await axiosInstance.post('/product-variants', {
          product_id: Number(createdProductId),
          color: 'Standard',
          size: '',
          price: String(basePrice),
          stock_quantity: baseStock,
        });
      }

      await fetchInitialData();
      resetForm();
      alert(`Product ${editingId ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error('Save error details:', error?.response?.data || error?.message || error);
      const serverMessage = error?.response?.data?.message || error?.message;
      alert(`Save Failed: ${serverMessage || 'Check browser console.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setVariantsByProduct(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedProductId === id) setExpandedProductId(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete product.');
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    const cleanString = (str?: string | null) =>
      str ? str.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"') : '';

    setForm({
      product_name: p.product_name || p.name || '',
      category_id: Number(p.category_id) || 0,
      brand_id: p.brand_id ? Number(p.brand_id) : undefined,
      short_description: cleanString(p.short_description),
      description: cleanString(p.description),
      status: p.status || 'active',
      price: '',
      stock_quantity: '',
    });
  };

  // --- VARIANT PANEL ---

  const toggleVariants = async (productId: number) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }
    setExpandedProductId(productId);
    setEditingVariantId(null);
    setAddingVariantFor(null);

    if (!variantsByProduct[productId]) {
      setLoadingVariantsFor(productId);
      try {
        const res = await axiosInstance.get(`/product-variants/product/${productId}`);
        const data = res.data || {};
        const list = data.varients;
      
        setVariantsByProduct(prev => ({
          ...prev,
          [productId]: Array.isArray(list) ? list : [],
        }));
      } catch (err) {
        console.error('Failed to fetch variants:', err);
        alert('Failed to load variants for this product.');
        setExpandedProductId(null);
      } finally {
        setLoadingVariantsFor(null);
      }
    }
  };

  const startEditVariant = (v: ProductVariant) => {
    setEditingVariantId(v.id);
    setVariantDraft({
      color: getVariantColor(v),
      size: getVariantSize(v),
      price: String(v.price ?? ''),
      stock_quantity: String(v.stock_quantity ?? ''),
    });
  };

  const cancelEditVariant = () => {
    setEditingVariantId(null);
    setVariantDraft(emptyDraft);
  };

  const saveVariantEdit = async (productId: number, variantId: number) => {
    setSavingVariantId(variantId);
    try {
      const payload = {
        product_id: productId,
        color: variantDraft.color || 'Standard',
        colors: variantDraft.color || 'Standard',
        size: variantDraft.size || '',
        sizes: variantDraft.size || '',
        price: String(variantDraft.price || 0),
        stock_quantity: Number(variantDraft.stock_quantity || 0),
      };

      const response = await axiosInstance.patch(`/product-variants/${variantId}`, payload);
      const updatedData = response.data?.updated_varient || response.data?.data;

      setVariantsByProduct(prev => {
        const currentList = prev[productId] || [];

        // Map over existing list to preserve exact index order
        const updatedList = currentList.map(v => {
          if (v.id === variantId) {
            return {
              ...v,
              ...updatedData,
              // Force strict string/number overrides in case backend omits them
              price: variantDraft.price,
              stock_quantity: variantDraft.stock_quantity,
              color: variantDraft.color,
              colors: variantDraft.color,
              size: variantDraft.size,
              sizes: variantDraft.size,
            };
          }
          return v;
        });

        return {
          ...prev,
          [productId]: [...updatedList], // Fresh array reference
        };
      });

      setEditingVariantId(null);
      setVariantDraft(emptyDraft);
    } catch (err) {
      console.error('Failed to update variant:', err);
      alert('Failed to update variant.');
    } finally {
      setSavingVariantId(null);
    }
  };

  const deleteVariant = async (productId: number, variantId: number) => {
    if (!confirm('Are you sure you want to delete this variant permanently?')) return;
    try {
      await axiosInstance.delete(`/product-variants/${variantId}`);
      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).filter(v => v.id !== variantId),
      }));
    } catch (err) {
      console.error('Failed to delete variant:', err);
      alert('Failed to delete variant from backend.');
    }
  };

  const startAddVariant = (productId: number) => {
    setAddingVariantFor(productId);
    setNewVariantDraft(emptyDraft);
  };

  const cancelAddVariant = () => {
    setAddingVariantFor(null);
    setNewVariantDraft(emptyDraft);
  };

  const createVariant = async (productId: number) => {
    setCreatingVariant(true);
    try {
      const payload = {
        product_id: Number(productId),
        color: newVariantDraft.color || 'Standard',
        size: newVariantDraft.size || '',
        price: String(newVariantDraft.price || 0),
        stock_quantity: Number(newVariantDraft.stock_quantity || 0),
      };
      const res = await axiosInstance.post('/product-variants', payload);
      const data = res.data || {};
      const created: ProductVariant =
        data.created_varient;
      console.log(data);
      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: [...(prev[productId] || []), created],
      }));
      setAddingVariantFor(null);
      setNewVariantDraft(emptyDraft);
    } catch (err) {
      console.error('Failed to create variant:', err);
      alert('Failed to create variant.');
    } finally {
      setCreatingVariant(false);
    }
  };

  // --- VARIANT IMAGES ---

  const addVariantImage = async (productId: number, variantId: number, file: File) => {
    const key = `add-${variantId}`;
    setBusyImageKey(key);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed);
      const res = await axiosInstance.post(`/product-variants-image/${variantId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || {};
      const newImage: ProductVariantImage = data.data || data.image || data;

      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).map(v =>
          v.id === variantId
            ? { ...v, images: [...(v.images || []), newImage] }
            : v
        ),
      }));
    } catch (err) {
      console.error('Failed to add image:', err);
      alert('Failed to upload image.');
    } finally {
      setBusyImageKey(null);
    }
  };

  const replaceVariantImage = async (
    productId: number,
    variantId: number,
    imageId: number,
    file: File
  ) => {
    const key = `replace-${imageId}`;
    setBusyImageKey(key);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed);
      const res = await axiosInstance.patch(`/product-variants-images/${imageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || {};
      const updatedUrl = data.data?.image_url || data.image_url;

      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).map(v =>
          v.id === variantId
            ? {
              ...v,
              images: (v.images || []).map(img =>
                img.id === imageId ? { ...img, image_url: updatedUrl || img.image_url } : img
              ),
            }
            : v
        ),
      }));
    } catch (err) {
      console.error('Failed to replace image:', err);
      alert('Failed to replace image.');
    } finally {
      setBusyImageKey(null);
    }
  };

  const deleteVariantImage = async (productId: number, variantId: number, imageId: number) => {
    if (!confirm('Are you sure you want to delete this image permanently?')) return;
    try {
      await axiosInstance.delete(`/product-variants-image/${imageId}`);
      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).map(v =>
          v.id === variantId
            ? { ...v, images: (v.images || []).filter(img => img.id !== imageId) }
            : v
        ),
      }));
    } catch (err) {
      console.error('Failed to delete image:', err);
      alert('Failed to delete image from backend.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Form */}
      <form onSubmit={handleSubmit} className={`${formSubBg} p-6 rounded-2xl border border-slate-800 space-y-6`}>
        <h3 className="text-base font-extrabold flex items-center gap-2 text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          {editingId ? 'Edit Product' : 'Add New Product'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title</label>
            <input
              type="text"
              required
              disabled={isSaving}
              value={form.product_name}
              onChange={e => setForm({ ...form, product_name: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="e.g. Casio G-Shock"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
            <select
              required
              disabled={isSaving}
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            >
              <option value={0}>Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
            <select
              disabled={isSaving}
              value={form.brand_id || 0}
              onChange={e => setForm({ ...form, brand_id: Number(e.target.value) || undefined })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            >
              <option value={0}>Select Brand (Optional)</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.brand_name || b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
            <select
              disabled={isSaving}
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as ProductStatus })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description</label>
            <input
              type="text"
              disabled={isSaving}
              value={form.short_description}
              onChange={e => setForm({ ...form, short_description: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="Short summary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Description</label>
            <textarea
              rows={1}
              disabled={isSaving}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
              placeholder="Detailed description"
            />
          </div>
        </div>

        {/* Base price/stock only shown when creating a brand-new product */}
        {!editingId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-dashed border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Base Price ($)</label>
              <input
                type="number"
                required
                disabled={isSaving}
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
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
                className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
                placeholder="0"
              />
            </div>
            <p className="md:col-span-2 text-[11px] text-slate-500">
              This creates a "Standard" variant automatically. You can add more variants, edit them,
              or manage images from the product list below once the product is created.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
          </button>

          {editingId && (
            <button
              type="button"
              disabled={isSaving}
              onClick={resetForm}
              className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-3 rounded-xl font-bold transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Product List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Status</th>
              <th className="p-3">Variants</th>
              <th className="p-3">Total Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isFetchingData ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-slate-400">
                  Loading datasets...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-slate-400">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p, index) => {
                const categoryObj = (categories || []).find(c => c && String(c.id) === String(p.category_id));
                const brandObj = (brands || []).find(b => b && String(b.id) === String(p.brand_id));
                const loadedVariants = variantsByProduct[p.id];
                const variantCount =
                  loadedVariants?.length ??
                  p.total_variants ??
                  (Array.isArray(p.variants) ? p.variants.length : 0);
                const isExpanded = expandedProductId === p.id;

                return (
                  <React.Fragment key={p?.id ? `prod-${p.id}` : index}>
                    <tr className={`hover:bg-indigo-500/5 ${borderRow}`}>
                      <td className="p-3 font-bold text-white">{p.name || '—'}</td>
                      <td className="p-3 text-xs text-slate-400">{p.category_name || '—'}</td>
                      <td className="p-3 text-xs text-slate-400">{p.brand_name || '—'}</td>
                      <td className="p-3 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                          {p.status || 'inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleVariants(p.id)}
                          className={`font-mono px-2 py-1 rounded-md border transition ${isExpanded
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'border-slate-700 text-indigo-400 hover:bg-indigo-600/10'
                            }`}
                        >
                          {variantCount} Variant{variantCount === 1 ? '' : 's'} {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>
                      <td className="p-3 font-bold">{p.stock_quantity ?? 0}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => startEditProduct(p)} className="text-xs text-indigo-400 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-rose-500 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className={borderRow}>
                        <td colSpan={7} className="p-0">
                          <div className="bg-slate-950/60 border-y border-indigo-500/10 p-4 space-y-3">
                            {loadingVariantsFor === p.id ? (
                              <p className="text-xs text-slate-400 text-center py-4">Loading variants...</p>
                            ) : (
                              <>
                                {(variantsByProduct[p.id] || []).length === 0 ? (
                                  <p className="text-xs text-slate-500 text-center py-3">No variants for this product yet.</p>
                                ) : (
                                  <div className="grid grid-cols-1 gap-3">
                                    {(variantsByProduct[p.id] || []).map(v => {
                                      const isEditingThis = editingVariantId === v.id;
                                      return (
                                        <div key={v.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
                                          {isEditingThis ? (
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                                              <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">Color</label>
                                                <input
                                                  type="text"
                                                  value={variantDraft.color}
                                                  onChange={e => setVariantDraft({ ...variantDraft, color: e.target.value })}
                                                  className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">Size</label>
                                                <select
                                                  value={variantDraft.size}
                                                  onChange={e => setVariantDraft({ ...variantDraft, size: e.target.value as ProductSize })}
                                                  className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                                >
                                                  <option value="">Select Size</option>
                                                  <option value="M">M</option>
                                                  <option value="L">L</option>
                                                  <option value="XL">XL</option>
                                                  <option value="XXL">XXL</option>
                                                  <option value="3XL">3XL</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">Price ($)</label>
                                                <input
                                                  type="number"
                                                  value={variantDraft.price}
                                                  onChange={e => setVariantDraft({ ...variantDraft, price: e.target.value })}
                                                  className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">Stock</label>
                                                <input
                                                  type="number"
                                                  value={variantDraft.stock_quantity}
                                                  onChange={e => setVariantDraft({ ...variantDraft, stock_quantity: e.target.value })}
                                                  className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                                />
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  type="button"
                                                  disabled={savingVariantId === v.id}
                                                  onClick={() => saveVariantEdit(p.id, v.id)}
                                                  className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-bold"
                                                >
                                                  {savingVariantId === v.id ? '...' : 'Save'}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={cancelEditVariant}
                                                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <div className="flex flex-wrap gap-4 text-xs">
                                                <span><span className="text-slate-500">Color:</span> {getVariantColor(v)}</span>
                                                <span><span className="text-slate-500">Size:</span> {getVariantSize(v)}</span>
                                                <span><span className="text-slate-500">Price:</span> ${v.price ?? 0}</span>
                                                <span><span className="text-slate-500">Stock:</span> {v.stock_quantity ?? 0}</span>
                                              </div>
                                              <div className="flex gap-3">
                                                <button
                                                  type="button"
                                                  onClick={() => startEditVariant(v)}
                                                  className="text-xs text-indigo-400 hover:underline font-semibold"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => deleteVariant(p.id, v.id)}
                                                  className="text-xs text-rose-400 hover:underline font-semibold"
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Images */}
                                          <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-slate-800/60">
                                            {(v.images || []).map(img => (
                                              <div key={img.id} className="relative group w-14 h-14">
                                                <img
                                                  src={img.image_url}
                                                  alt="variant"
                                                  className="w-14 h-14 object-cover rounded border border-slate-700"
                                                />
                                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition rounded flex flex-col items-center justify-center gap-1">
                                                  <label className="text-[9px] text-indigo-300 underline cursor-pointer">
                                                    Replace
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) replaceVariantImage(p.id, v.id, img.id, file);
                                                      }}
                                                    />
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => deleteVariantImage(p.id, v.id, img.id)}
                                                    className="text-[9px] text-rose-400 underline"
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                                {busyImageKey === `replace-${img.id}` && (
                                                  <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center text-[8px] text-white">...</div>
                                                )}
                                              </div>
                                            ))}
                                            <label className="w-14 h-14 border border-dashed border-slate-700 rounded flex items-center justify-center text-[9px] text-slate-500 cursor-pointer hover:border-indigo-500 hover:text-indigo-400">
                                              {busyImageKey === `add-${v.id}` ? '...' : '+ Add'}
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                  const file = e.target.files?.[0];
                                                  if (file) addVariantImage(p.id, v.id, file);
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Add variant */}
                                {addingVariantFor === p.id ? (
                                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-slate-900/70 space-y-2">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Color</label>
                                        <input
                                          type="text"
                                          value={newVariantDraft.color}
                                          onChange={e => setNewVariantDraft({ ...newVariantDraft, color: e.target.value })}
                                          className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Size</label>
                                        <select
                                          value={newVariantDraft.size}
                                          onChange={e => setNewVariantDraft({ ...newVariantDraft, size: e.target.value as ProductSize })}
                                          className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                        >
                                          <option value="">Select Size</option>
                                          <option value="M">M</option>
                                          <option value="L">L</option>
                                          <option value="XL">XL</option>
                                          <option value="XXL">XXL</option>
                                          <option value="3XL">3XL</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Price ($)</label>
                                        <input
                                          type="number"
                                          value={newVariantDraft.price}
                                          onChange={e => setNewVariantDraft({ ...newVariantDraft, price: e.target.value })}
                                          className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Stock</label>
                                        <input
                                          type="number"
                                          value={newVariantDraft.stock_quantity}
                                          onChange={e => setNewVariantDraft({ ...newVariantDraft, stock_quantity: e.target.value })}
                                          className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          disabled={creatingVariant}
                                          onClick={() => createVariant(p.id)}
                                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-bold"
                                        >
                                          {creatingVariant ? '...' : 'Create'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelAddVariant}
                                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startAddVariant(p.id)}
                                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-lg font-bold"
                                  >
                                    + Add Variant
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

}