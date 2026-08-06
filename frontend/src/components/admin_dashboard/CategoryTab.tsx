'use client';

import { useState, useEffect } from 'react';
import { 
  CategoryType, 
  CreateCategoryInput,
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "../../services/product.service";

type CategoryForm = {
  name: string;
  parentId: string | null;
};

type CategoryTabProps = {
  categories?: CategoryType[];
  onSave?: (data: CategoryForm, id: string | null) => void;
  onDelete?: (id: string) => void;
  formSubBg: string;
  tableHeaderBg: string;
  inputBg: string;
  borderRow: string;
};

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CategoryTab({
  categories: initialCategories = [],
  onSave,
  onDelete,
  formSubBg,
  tableHeaderBg,
  inputBg,
  borderRow,
}: CategoryTabProps) {
  const [form, setForm] = useState<CategoryForm>({ name: '', parentId: null });
  const [categoryList, setCategoryList] = useState<CategoryType[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch API handler
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      
      setCategoryList(response.All_categories);
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategoryList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: '', parentId: null });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);

    try {
      const categoryData: CreateCategoryInput = {
        category_name: form.name.trim(),
        url_slug: generateSlug(form.name),
       parent_category_id: form.parentId ? Number(form.parentId) : null,
        status: 'active',
      };

      if (editingId) {
        await updateCategory(editingId, categoryData);
      } else {
        await createCategory(categoryData);
      }

      await fetchCategories(); // Refresh list

      if (onSave) onSave(form, editingId);

      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteCategory(id);
      await fetchCategories(); // Refresh list

      if (onDelete) onDelete(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
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
            value={form.parentId || ''}
            disabled={loading}
            onChange={e => setForm({ ...form, parentId: e.target.value ? e.target.value : null })}
            className={`w-full text-xs p-2.5 rounded-lg border outline-none ${inputBg}`}
          >
            <option value="">None (Top-Level)</option>
            {(categoryList || [])
              .filter(c => String(c.id) !== editingId)
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            {loading ? 'Saving...' : editingId ? 'Update Category' : 'Save Category'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table Section */}
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
            {(categoryList || []).map(c => {
              const parent = (categoryList || []).find(
                p => String(p.id) === String(c.parent_category_id)
              );
              return (
                <tr key={c.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                  <td className="p-3 font-bold">{c.category_name}</td>
                  <td className="p-3 text-xs text-slate-400">
                    {parent ? `↳ ${parent.category_name}` : '—'}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button 
                      onClick={() => { 
                        setEditingId(String(c.id)); 
                        setForm({ 
                          name: c.category_name, 
                          parentId: c.parent_category_id ? String(c.parent_category_id) : null 
                        }); 
                      }} 
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(String(c.id))} 
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
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