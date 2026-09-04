'use client';

import React, { useEffect, useState } from 'react';
import AxiosInstance from '../../api/axiosInstance';
import { compressImage } from '../../services/compressImage';

import {
  ProductTabProps,
  Product,
  ProductVariant,
  VariantDraft,
  Brand,
  ProductVariantImage,
  ProductStatus,
  ProductSize,
  CategoryType,
  getCategories,
  getAllProducts,
  getAllBrands,
} from '@/src/services/product.service';

import ProductForm from './productTapComponents/ProductForm';
import ProductTable from './productTapComponents/ProductTable';


const emptyDraft: VariantDraft = { color: '', size: '', price: '', stock_quantity: '' };

// --- small helpers (kept here since we're not splitting out a utils file) ---

export const getVariantColor = (v: ProductVariant) => v.colors || '';
export const getVariantSize = (v: ProductVariant) => (v.sizes || '') as ProductSize | '';

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + `-${Date.now()}`;

const cleanString = (str?: string | null) =>
  str ? str.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"') : '';

export default function ProductTab({
  formSubBg = 'bg-slate-900',
  tableHeaderBg = 'bg-slate-800',
  inputBg = 'bg-slate-950 text-white border-slate-700',
  borderRow = 'border-slate-800',
}: ProductTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_products: 0,
    per_page: 10,
  });
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
        getAllProducts(1),
        getCategories(),
        getAllBrands(),
      ]);

      setProducts(productsRes?.all_products || []);
      // Extract pagination metadata from server response
      setPagination(productsRes?.meta || {
        current_page: 1,
        total_pages: 1,
        total_products: 0,
        per_page: 10,
      });

      setCategories(categoriesRes?.All_categories || []);
      setBrands(brandsRes?.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Fetches a specific page of products.
  // mode: 'append'  -> used by "Load More" (infinite-scroll style)
  // mode: 'replace' -> used by Previous/Next page navigation
  const fetchProductsPage = async (page: number, mode: 'append' | 'replace') => {
    setIsFetchingData(true);
    try {
      const productsRes = await getAllProducts(page);
      const newProducts = productsRes?.all_products || [];
      const meta = productsRes?.meta || {
        current_page: page,
        total_pages: pagination.total_pages,
        total_products: pagination.total_products,
        per_page: pagination.per_page,
      };

      setProducts(prev => (mode === 'append' ? [...prev, ...newProducts] : newProducts));
      setPagination(meta);
    } catch (error) {
      console.error(`Failed to fetch products page ${page}:`, error);
      alert('Failed to load more products.');
    } finally {
      setIsFetchingData(false);
    }
  };

  // "Load More" — appends the next page onto the currently loaded list
  const handleLoadMore = () => {
    if (pagination.current_page >= pagination.total_pages) return;
    fetchProductsPage(pagination.current_page + 1, 'append');
  };

  // Previous / Next — replaces the currently loaded list with the requested page
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages) return;
    fetchProductsPage(page, 'replace');
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

        await AxiosInstance.patch(`/products/${editingId}`, updatePayload);
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

        const productRes = await AxiosInstance.post('/products', productPayload);
        const resData = productRes.data || {};
        const createdProductId =
          resData.created_product?.id || resData.product?.id || resData.data?.id || resData.id;

        if (!createdProductId) {
          throw new Error('Could not retrieve created Product ID.');
        }

        // Create a default "Standard" variant so the product has at least one.
        await AxiosInstance.post('/product-variants', {
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
      await AxiosInstance.delete(`/products/${id}`);
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
    setForm({
      product_name: p.name || '',
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
        const res = await AxiosInstance.get(`/product-variants/product/${productId}`);
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

      const response = await AxiosInstance.patch(`/product-variants/${variantId}`, payload);
      const updatedData = response.data?.updated_varient || response.data?.data;

      setVariantsByProduct(prev => {
        const currentList = prev[productId] || [];
        const updatedList = currentList.map(v => {
          if (v.id === variantId) {
            return {
              ...v,
              ...updatedData,
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

        return { ...prev, [productId]: [...updatedList] };
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
      await AxiosInstance.delete(`/product-variants/${variantId}`);
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
      const res = await AxiosInstance.post('/product-variants', payload);
      const data = res.data || {};
      const created: ProductVariant = data.created_varient;

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
      const res = await AxiosInstance.post(`/product-variants-image/${variantId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || {};
      const newImage: ProductVariantImage = data.data || data.image || data;

      setVariantsByProduct(prev => ({
        ...prev,
        [productId]: (prev[productId] || []).map(v =>
          v.id === variantId ? { ...v, images: [...(v.images || []), newImage] } : v
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
      const res = await AxiosInstance.patch(`/product-variants-images/${imageId}`, formData, {
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
      await AxiosInstance.delete(`/product-variants-image/${imageId}`);
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
      <ProductForm
        form={form}
        setForm={setForm}
        categories={categories}
        brands={brands}
        editingId={editingId}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onCancelEdit={resetForm}
        formSubBg={formSubBg}
        inputBg={inputBg}
      />

      <ProductTable
        products={products}
        pagination={pagination}
        isFetchingData={isFetchingData}
        tableHeaderBg={tableHeaderBg}
        borderRow={borderRow}
        inputBg={inputBg}
        expandedProductId={expandedProductId}
        variantsByProduct={variantsByProduct}
        loadingVariantsFor={loadingVariantsFor}
        onToggleVariants={toggleVariants}
        onEditProduct={startEditProduct}
        onDeleteProduct={handleDelete}
        onLoadMore={handleLoadMore}
        onPageChange={handlePageChange}
        editingVariantId={editingVariantId}
        variantDraft={variantDraft}
        setVariantDraft={setVariantDraft}
        savingVariantId={savingVariantId}
        onStartEditVariant={startEditVariant}
        onCancelEditVariant={cancelEditVariant}
        onSaveVariantEdit={saveVariantEdit}
        onDeleteVariant={deleteVariant}
        addingVariantFor={addingVariantFor}
        newVariantDraft={newVariantDraft}
        setNewVariantDraft={setNewVariantDraft}
        creatingVariant={creatingVariant}
        onStartAddVariant={startAddVariant}
        onCancelAddVariant={cancelAddVariant}
        onCreateVariant={createVariant}
        busyImageKey={busyImageKey}
        onAddImage={addVariantImage}
        onReplaceImage={replaceVariantImage}
        onDeleteImage={deleteVariantImage}
      />
    </div>
  );
}
