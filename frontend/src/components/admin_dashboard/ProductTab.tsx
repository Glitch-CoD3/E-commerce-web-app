'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/src/api/axiosInstance';

import {
  ProductStatus, ProductSize, CategoryType, getCategories,
  getAllProducts, getAllBrands
} from '@/src/services/product.service';

// --- PROVIDED TYPES ---


export type Brand = {
  id: number;
  name: string;
};

export type ProductVariantImage = {
  id: number;
  product_variant_id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  colors?: string | null;
  sizes?: ProductSize | null;
  price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  images?: ProductVariantImage[];
};

export type Product = {
  id: number;
  category_id: number;
  brand_id?: number | null;
  product_name: string;
  url_slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  variants?: ProductVariant[];
  category?: CategoryType;
  brand?: Brand;
};

export type CreateVariantImageInput = {
  image_url: string;
  sort_order?: number;
};

export type CreateVariantInput = {
  colors?: string;
  sizes?: ProductSize;
  price: number;
  stock_quantity?: number;
  images?: CreateVariantImageInput[];
};

export type CreateProductWithVariantsInput = {
  category_id: number;
  brand_id?: number | null;
  product_name: string;
  url_slug: string;
  description?: string;
  short_description?: string;
  price: number;
  stock_quantity?: number;
  status: ProductStatus;
  variants: CreateVariantInput[];
};

// Local UI helper types
type VariantImage = { id: string; file?: File; previewUrl: string };
type FormVariant = {
  id: string;
  colors: string;
  sizes: ProductSize | '';
  price: number;
  stock_quantity: number;
  images: VariantImage[];
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
  // Shared Fetched Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Async Operation Indicators
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Editing state (number ID tracking backend record)
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    product_name: '',
    category_id: 0,
    brand_id: 0 as number | undefined,
    short_description: '',
    description: '',
    status: 'active' as ProductStatus,
    variants: [] as FormVariant[],
  });

  const [tempVariant, setTempVariant] = useState<{
    colors: string;
    sizes: ProductSize | '';
    price: number;
    stock_quantity: number;
    images: VariantImage[];
  }>({ colors: '', sizes: '', price: 0, stock_quantity: 0, images: [] });

  // 1. Initial Data Fetching Effect
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
  setIsFetchingData(true);
  try {
    // 🚀 Fetch all endpoints in parallel rather than sequential waterfalls
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      getAllProducts(),
      getCategories(),
      getAllBrands()
    ]);

    setProducts(productsRes?.all_products || []);
    setCategories(categoriesRes?.All_categories || []);
    setBrands(brandsRes?.data || []);

  } catch (error) {
    console.error('Failed to fetch initial products tab data:', error);
  } finally {
    setIsFetchingData(false);
  }
};

  // Helper function to build URL slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Handle local image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages: VariantImage[] = files.map(file => ({
      id: Math.random().toString(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setTempVariant(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  // Add temporary variant option to current draft product state
  const handleAddVariant = async () => {
    if (!tempVariant.colors || !tempVariant.sizes || tempVariant.price <= 0) {
      alert('Please specify variant color, valid size (M, L, XL, XXL, 3XL), and price.');
      return;
    }

    setIsUploading(true);
    let uploadedUrls: string[] = [];
    const filesToUpload = tempVariant.images.filter(img => img.file).map(img => img.file as File);

    if (filesToUpload.length > 0) {
      try {
        const formData = new FormData();
        filesToUpload.forEach(f => formData.append('images', f));

        const res = await axiosInstance.post<{ urls: string[] }>('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedUrls = res.data?.urls || [];
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    const finalVariantImages: VariantImage[] = tempVariant.images.map((img, idx) => ({
      id: img.id,
      previewUrl: img.file ? uploadedUrls[idx] || img.previewUrl : img.previewUrl,
    }));

    const newVariant: FormVariant = {
      id: Math.random().toString(),
      colors: tempVariant.colors,
      sizes: tempVariant.sizes,
      price: Number(tempVariant.price),
      stock_quantity: Number(tempVariant.stock_quantity),
      images: finalVariantImages,
    };

    setForm(prev => ({ ...prev, variants: [...prev.variants, newVariant] }));
    setTempVariant({ colors: '', sizes: '', price: 0, stock_quantity: 0, images: [] });
    setIsUploading(false);
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
    setTempVariant({ colors: '', sizes: '', price: 0, stock_quantity: 0, images: [] });
    setEditingId(null);
  };

  // 2. Submit API Operation (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) {
      alert('Please select a product category.');
      return;
    }
    if (form.variants.length === 0) {
      alert('Please add at least one variant option before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const basePrice = form.variants[0]?.price || 0;
      const totalStock = form.variants.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);

      const payload: CreateProductWithVariantsInput = {
        category_id: Number(form.category_id),
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        product_name: form.product_name,
        url_slug: generateSlug(form.product_name),
        description: form.description,
        short_description: form.short_description,
        price: basePrice,
        stock_quantity: totalStock,
        status: form.status,
        variants: form.variants.map(v => ({
          colors: v.colors,
          sizes: v.sizes as ProductSize,
          price: v.price,
          stock_quantity: v.stock_quantity,
          images: v.images.map((img, index) => ({
            image_url: img.previewUrl,
            sort_order: index,
          })),
        })),
      };

      if (editingId) {
        // PUT / API Update request
        const res = await axiosInstance.put<Product>(`/products/${editingId}`, payload);
        setProducts(prev => prev.map(p => (p.id === editingId ? res.data : p)));
      } else {
        // POST / API Creation request
        const res = await axiosInstance.post<Product>('/products', payload);
        setProducts(prev => [res.data, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error('Failed to submit product data:', error);
      alert('An error occurred while saving the product.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Delete API Operation
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await axiosInstance.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Creation Form */}
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
              placeholder="e.g. Wireless Noise-Canceling Headphones"
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
              <option value={0}>Select Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.brand_name}</option>
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
              placeholder="Brief summary for product cards"
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
              placeholder="Detailed product features and specs"
            />
          </div>
        </div>

        {/* Variant Creation Subsection */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-4">
          <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Add Variants</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              disabled={isSaving}
              placeholder="Color (e.g. Black)"
              value={tempVariant.colors}
              onChange={e => setTempVariant({ ...tempVariant, colors: e.target.value })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />

            <select
              disabled={isSaving}
              value={tempVariant.sizes}
              onChange={e => setTempVariant({ ...tempVariant, sizes: e.target.value as ProductSize })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            >
              <option value="">Select Size</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="3XL">3XL</option>
            </select>

            <input
              type="number"
              disabled={isSaving}
              placeholder="Price ($)"
              value={tempVariant.price || ''}
              onChange={e => setTempVariant({ ...tempVariant, price: Number(e.target.value) })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="number"
              disabled={isSaving}
              placeholder="Stock Qty"
              value={tempVariant.stock_quantity || ''}
              onChange={e => setTempVariant({ ...tempVariant, stock_quantity: Number(e.target.value) })}
              className={`text-xs p-2 rounded-lg border outline-none ${inputBg}`}
            />
            <input
              type="file"
              multiple
              disabled={isSaving}
              accept="image/*"
              onChange={handleImageSelect}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleAddVariant}
            disabled={isUploading || isSaving}
            className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 font-bold px-4 py-2 rounded-lg transition"
          >
            {isUploading ? 'Uploading images...' : '+ Add Variant Option'}
          </button>

          {/* Render Added Variants */}
          {form.variants.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {form.variants.map((v, idx) => (
                <div key={idx} className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2 rounded-lg flex items-center gap-3">
                  <span><strong>{v.colors}</strong> / {v.sizes} — ${v.price} ({v.stock_quantity} in stock)</span>
                  <button
                    type="button"
                    disabled={isSaving}
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            {isSaving ? 'Saving Product...' : editingId ? 'Update Product' : 'Save Product & Inventory'}
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

      {/* Products Display Table */}
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
            Loading product dataset...
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

          // Fix 1: Fallback key prevents React's "unique key" warning if p.id is missing or duplicate
          const uniqueKey = p?.id ? `product-${p.id}` : `prod-idx-${index}`;

          return (
            <tr key={uniqueKey} className={`hover:bg-indigo-500/5 ${borderRow}`}>
              <td className="p-3 font-bold text-white">{p.product_name || p.name || '—'}</td>
              <td className="p-3 text-xs text-slate-400">{categoryObj?.category_name || p.category?.category_name || '—'}</td>
              {/* Fix 2: Applied brandObj lookup here */}
              <td className="p-3 text-xs text-slate-400">{brandObj?.brand_name || p.brand_name || '—'}</td>
              <td className="p-3 text-xs">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                  {p.status || 'inactive'}
                </span>
              </td>
              <td className="p-3 text-xs font-mono text-indigo-400">{p.total_variants || (p.variants || []).length || 0} Option(s)</td>
              <td className="p-3 font-bold">{p.stock_quantity ?? 0}</td>
              <td className="p-3 text-right space-x-2">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setForm({
                      product_name: p.product_name || p.name || '',
                      category_id: p.category_id,
                      brand_id: p.brand_id || undefined,
                      short_description: p.short_description || '',
                      description: p.description || '',
                      status: p.status || 'active',
                      // Fix 3: Optional chaining and fallbacks for variant mapping
                      variants: (p.variants || []).map((v, vIdx) => ({
                        id: v?.id ? String(v.id) : `variant-${vIdx}`,
                        colors: v?.colors || '',
                        sizes: v?.sizes || '',
                        price: v?.price ?? 0,
                        stock_quantity: v?.stock_quantity ?? 0,
                        images: (v?.images || []).map((img, imgIdx) => ({
                          id: img?.id ? String(img.id) : `img-${imgIdx}`,
                          previewUrl: img?.image_url || img?.previewUrl || '',
                        })),
                      })),
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