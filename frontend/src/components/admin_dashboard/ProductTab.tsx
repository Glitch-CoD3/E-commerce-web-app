'use client';

import { useState, useEffect } from 'react';
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

type VariantImage = {
  id: string; // Internal temporary ID or numeric image ID string
  file?: File; // File present only if newly selected
  previewUrl: string;
  isExisting?: boolean; // Indicates if image is already saved on server
};

type FormVariantCard = {
  id: string; // Unique UI key
  dbVariantId?: number; // Backend Variant ID (if previously saved)
  colors: string;
  sizes: ProductSize | '';
  price: number | '';
  stock_quantity: number | '';
  images: VariantImage[] ;
  isNew?: boolean;
};

type ProductTabProps = {
  formSubBg?: string;
  tableHeaderBg?: string;
  inputBg?: string;
  borderRow?: string;
};

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
    variants: [] as FormVariantCard[],
  });

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

  // --- Dynamic Variant Card Management ---

  const addVariantBox = () => {
    const newBox: FormVariantCard = {
      id: `new-${Date.now()}-${Math.random()}`,
      colors: '',
      sizes: '',
      price: '',
      stock_quantity: '',
      images: [],
      isNew: true,
    };
    setForm(prev => ({ ...prev, variants: [...prev.variants, newBox] }));
  };

  // DELETE Variant (From UI & Backend if saved)
  const removeVariantBox = async (v: FormVariantCard) => {
    if (v.dbVariantId) {
      if (!confirm('Are you sure you want to delete this variant permanently?')) return;
      try {
        await axiosInstance.delete(`/product-variants/${v.dbVariantId}`);
      } catch (err) {
        console.error('Failed to delete variant:', err);
        alert('Could not delete variant from backend.');
        return;
      }
    }

    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter(item => item.id !== v.id),
    }));
  };

  const updateVariantField = (id: string, field: keyof FormVariantCard, value: any) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => (v.id === id ? { ...v, [field]: value } : v)),
    }));
  };

  const handleVariantImageSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newImages: VariantImage[] = files.map(file => ({
      id: `img-new-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isExisting: false,
    }));

    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.id === id ? { ...v, images: [...v.images, ...newImages] } : v
      ),
    }));
  };

  // DELETE Image (From UI & Backend if saved)
  const removeVariantImage = async (variantId: string, image: VariantImage) => {
    if (image.isExisting && image.id) {
      if (!confirm('Are you sure you want to delete this image permanently?')) return;
      try {
        await axiosInstance.delete(`/product-variants-image/${image.id}`);
      } catch (err) {
        console.error('Failed to delete image:', err);
        alert('Failed to delete image from backend.');
        return;
      }
    }

    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.id === variantId
          ? { ...v, images: v.images.filter(img => img.id !== image.id) }
          : v
      ),
    }));
  };

  const resetForm = () => {
    setForm({
      product_name: '',
      category_id: 0,
      brand_id: 0,
      short_description: '',
      description: '',
      status: 'active',
      variants: [],
    });
    setEditingId(null);
  };

  // --- SUBMISSION LOGIC ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) {
      alert('Please select a product category.');
      return;
    }

    setIsSaving(true);

    try {
      const finalVariants: FormVariantCard[] =
        form.variants.length > 0
          ? form.variants.map(v => ({
              ...v,
              colors: v.colors.trim() ? v.colors.trim() : 'Standard',
            }))
          : [
              {
                id: 'default-box',
                colors: 'Standard',
                sizes: '',
                price: 0,
                stock_quantity: 1,
                images: [],
              },
            ];

      const basePrice = Number(finalVariants[0]?.price) || 0;
      const totalStock = finalVariants.reduce(
        (acc, v) => acc + (Number(v.stock_quantity) || 0),
        0
      );

      if (editingId) {
        // --- UPDATE PRODUCT FLOW (PATCH) ---
        const updatePayload = {
          category_id: Number(form.category_id),
          brand_id: form.brand_id && Number(form.brand_id) > 0 ? Number(form.brand_id) : null,
          product_name: form.product_name,
          url_slug: generateSlug(form.product_name),
          description: form.description || null,
          short_description: form.short_description || null,
          price: String(basePrice),
          stock_quantity: totalStock,
          status: form.status,
        };

        // 1. Update Product Details via PATCH
        await axiosInstance.patch(`/products/${editingId}`, updatePayload);

        // 2. Loop Through Variants to Update (PATCH) or Create (POST)
        for (const variantBox of finalVariants) {
          let variantId = variantBox.dbVariantId;

          const variantPayload = {
            product_id: Number(editingId),
            color: variantBox.colors || 'Standard',
            size: variantBox.sizes || '',
            price: String(variantBox.price || 0),
            stock_quantity: Number(variantBox.stock_quantity || 0),
          };

          if (variantId) {
            // Update Existing Variant using PATCH
            await axiosInstance.patch(`/product-variants/${variantId}`, variantPayload);
          } else {
            // Create New Variant added during Edit Session
            const variantRes = await axiosInstance.post('/product-variants', variantPayload);
            const varData = variantRes.data || {};
            variantId =
              varData.created_varient?.id ||
              varData.created_variant?.id ||
              varData.variant?.id ||
              varData.data?.id ||
              varData.id;
          }

          // Upload any NEW image files attached to this variant
          if (variantId && variantBox.images && variantBox.images.length > 0) {
            for (const imgObj of variantBox.images) {
              if (imgObj.file) {
                const compressedFile = await compressImage(imgObj.file);
                const formData = new FormData();
                formData.append('image', compressedFile);

                await axiosInstance.post(
                  `/product-variants-image/${variantId}`,
                  formData,
                  { headers: { 'Content-Type': 'multipart/form-data' } }
                );
              }
            }
          }
        }
      } else {
        // --- CREATE BRAND NEW PRODUCT FLOW ---
        const productPayload = {
          category_id: Number(form.category_id),
          brand_id: form.brand_id && Number(form.brand_id) > 0 ? Number(form.brand_id) : null,
          product_name: form.product_name,
          url_slug: generateSlug(form.product_name),
          description: form.description || null,
          short_description: form.short_description || null,
          price: String(basePrice),
          stock_quantity: totalStock,
          status: form.status,
        };

        const productRes = await axiosInstance.post('/products', productPayload);
        const resData = productRes.data || {};
        const createdProductId =
          resData.created_product?.id ||
          resData.product?.id ||
          resData.data?.id ||
          resData.id;

        if (!createdProductId) {
          throw new Error('Could not retrieve created Product ID.');
        }

        for (const variantBox of finalVariants) {
          const variantPayload = {
            product_id: Number(createdProductId),
            color: variantBox.colors || 'Standard',
            size: variantBox.sizes || '',
            price: String(variantBox.price || 0),
            stock_quantity: Number(variantBox.stock_quantity || 0),
          };

          const variantRes = await axiosInstance.post('/product-variants', variantPayload);
          const varData = variantRes.data || {};
          const createdVariantId =
            varData.created_varient?.id ||
            varData.created_variant?.id ||
            varData.variant?.id ||
            varData.data?.id ||
            varData.id;

          if (!createdVariantId) {
            throw new Error('Could not retrieve created Variant ID.');
          }

          if (variantBox.images && variantBox.images.length > 0) {
            for (const imgObj of variantBox.images) {
              if (imgObj.file) {
                const compressedFile = await compressImage(imgObj.file);
                const formData = new FormData();
                formData.append('image', compressedFile);

                await axiosInstance.post(
                  `/product-variants-image/${createdVariantId}`,
                  formData,
                  { headers: { 'Content-Type': 'multipart/form-data' } }
                );
              }
            }
          }
        }
      }

      await fetchInitialData();
      resetForm();
      alert(`Product ${editingId ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error('Save error details:', error?.response?.data || error?.message || error);
      const serverMessage = error?.response?.data?.message || error?.message;
      alert(`Save Failed: ${serverMessage || 'Check browser console.'}`);
    } {
      setIsSaving(false);
    }
  };

  // DELETE PRODUCT
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete product.');
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

        {/* Basic Fields */}
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

        {/* --- DYNAMIC VARIANT BOXES --- */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Product Variants</h4>
              <p className="text-[11px] text-slate-400">Configure size, color, stock, and upload images per variant.</p>
            </div>

            <button
              type="button"
              onClick={addVariantBox}
              disabled={isSaving}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5"
            >
              <span>+ Add Variant Box</span>
            </button>
          </div>

          {form.variants.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
              No custom variants added. (A standard variant will be created on save).
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {form.variants.map((v, index) => (
                <div key={v.id} className="p-4 rounded-xl border border-indigo-500/20 bg-slate-950/80 space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      Variant #{index + 1}
                      {v.dbVariantId && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          Saved (ID: {v.dbVariantId})
                        </span>
                      )}
                      {v.isNew && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                          New
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariantBox(v)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Delete Variant
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Color</label>
                      <input
                        type="text"
                        placeholder="e.g. Red"
                        value={v.colors}
                        onChange={e => updateVariantField(v.id, 'colors', e.target.value)}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Size</label>
                      <select
                        value={v.sizes}
                        onChange={e => updateVariantField(v.id, 'sizes', e.target.value as ProductSize)}
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
                      <label className="block text-[11px] text-slate-400 mb-1">Price ($)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={v.price}
                        onChange={e => updateVariantField(v.id, 'price', e.target.value)}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={v.stock_quantity}
                        onChange={e => updateVariantField(v.id, 'stock_quantity', e.target.value)}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>
                  </div>

                  {/* Image Upload Box */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Images for ({v.colors || 'Variant'})
                    </label>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => handleVariantImageSelect(v.id, e)}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
                    />

                    {v.images.length > 0 && (
                      <div className="flex gap-2 items-center flex-wrap pt-2">
                        {v.images.map(img => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.previewUrl}
                              alt="variant preview"
                              className="w-12 h-12 object-cover rounded border border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantImage(v.id, img)}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Product & Variants' : 'Save Product'}
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

                return (
                  <tr key={p?.id ? `prod-${p.id}` : index} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                    <td className="p-3 font-bold text-white">{p.product_name || p.name || '—'}</td>
                    <td className="p-3 text-xs text-slate-400">{p.category_name || categoryObj?.category_name || '—'}</td>
                    <td className="p-3 text-xs text-slate-400">{p.brand_name || brandObj?.brand_name || brandObj?.name || '—'}</td>
                    <td className="p-3 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status || 'inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-mono text-indigo-400">
                      {p.total_variants ?? (Array.isArray(p.variants) ? p.variants.length : 0)} Variant(s)
                    </td>
                    <td className="p-3 font-bold">{p.stock_quantity ?? 0}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(p.id);

                          const cleanString = (str?: string | null) =>
                            str ? str.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"') : '';

                          let mappedVariants: FormVariantCard[] = [];

                          if (Array.isArray(p.variants) && p.variants.length > 0) {
                            mappedVariants = p.variants.map((v, vIdx) => ({
                              id: v?.id ? String(v.id) : `var-${vIdx}`,
                              dbVariantId: v?.id,
                              colors: v?.color || v?.colors || '',
                              sizes: (v?.size || v?.sizes || '') as ProductSize | '',
                              price: Number(v?.price ?? p.price) || 0,
                              stock_quantity: Number(v?.stock_quantity ?? p.stock_quantity) || 0,
                              images: (Array.isArray(v?.images) ? v.images : []).map((img, imgIdx) => ({
                                id: img?.id ? String(img.id) : `img-${imgIdx}`,
                                previewUrl: img?.image_url || '',
                                isExisting: true,
                              })),
                              isNew: false,
                            }));
                          }

                          setForm({
                            product_name: p.product_name || p.name || '',
                            category_id: Number(p.category_id) || 0,
                            brand_id: p.brand_id ? Number(p.brand_id) : undefined,
                            short_description: cleanString(p.short_description),
                            description: cleanString(p.description),
                            status: p.status || 'active',
                            variants: mappedVariants,
                          });
                        }}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-rose-500 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}