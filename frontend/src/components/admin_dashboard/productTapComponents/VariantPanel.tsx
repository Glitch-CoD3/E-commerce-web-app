import React from 'react';
import { ProductSize } from '../../../services/product.service';
import { getVariantColor, getVariantSize } from '../ProductTab';
import { ProductVariant, VariantDraft } from '../../../services/product.service';

const SIZE_OPTIONS: ProductSize[] = ['M', 'L', 'XL', 'XXL', '3XL'];

interface VariantImageItem {
  id: number;
  image_url: string;
}

interface VariantPanelProps {
  productId: number;
  isLoading: boolean;
  variants: ProductVariant[];
  inputBg: string;

  editingVariantId: number | null;
  variantDraft: VariantDraft;
  setVariantDraft: React.Dispatch<React.SetStateAction<VariantDraft>>;
  savingVariantId: number | null;
  onStartEditVariant: (v: ProductVariant) => void;
  onCancelEditVariant: () => void;
  onSaveVariantEdit: (productId: number, variantId: number) => void;
  onDeleteVariant: (productId: number, variantId: number) => void;

  addingVariantFor: number | null;
  newVariantDraft: VariantDraft;
  setNewVariantDraft: React.Dispatch<React.SetStateAction<VariantDraft>>;
  creatingVariant: boolean;
  onStartAddVariant: (productId: number) => void;
  onCancelAddVariant: () => void;
  onCreateVariant: (productId: number) => void;

  busyImageKey: string | null;
  onAddImage: (productId: number, variantId: number, file: File) => void;
  onReplaceImage: (productId: number, variantId: number, imageId: number, file: File) => void;
  onDeleteImage: (productId: number, variantId: number, imageId: number) => void;
}

export default function VariantPanel({
  productId,
  isLoading,
  variants,
  inputBg,
  editingVariantId,
  variantDraft,
  setVariantDraft,
  savingVariantId,
  onStartEditVariant,
  onCancelEditVariant,
  onSaveVariantEdit,
  onDeleteVariant,
  addingVariantFor,
  newVariantDraft,
  setNewVariantDraft,
  creatingVariant,
  onStartAddVariant,
  onCancelAddVariant,
  onCreateVariant,
  busyImageKey,
  onAddImage,
  onReplaceImage,
  onDeleteImage,
}: VariantPanelProps) {
  if (isLoading) {
    return <p className="text-xs text-slate-400 text-center py-4">Loading variants...</p>;
  }

  return (
    <div className="bg-slate-950/60 border-y border-indigo-500/10 p-3 sm:p-4 space-y-3 w-full">
      {variants.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-3">No variants for this product yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {variants.map((v) => {
            const isEditingThis = editingVariantId === v.id;
            return (
              <div
                key={v.id}
                className="p-3 sm:p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 shadow-inner"
              >
                {/* --- View / Edit Section --- */}
                {isEditingThis ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Color</label>
                      <input
                        type="text"
                        value={variantDraft.color}
                        onChange={(e) => setVariantDraft({ ...variantDraft, color: e.target.value })}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Size</label>
                      <select
                        value={variantDraft.size}
                        onChange={(e) =>
                          setVariantDraft({ ...variantDraft, size: e.target.value as ProductSize })
                        }
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      >
                        <option value="">Select Size</option>
                        {SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={variantDraft.price}
                        onChange={(e) => setVariantDraft({ ...variantDraft, price: e.target.value })}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Stock</label>
                      <input
                        type="number"
                        value={variantDraft.stock_quantity}
                        onChange={(e) => setVariantDraft({ ...variantDraft, stock_quantity: e.target.value })}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 md:col-span-1 pt-1 sm:pt-0">
                      <button
                        type="button"
                        disabled={savingVariantId === v.id}
                        onClick={() => onSaveVariantEdit(productId, v.id)}
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg font-bold transition"
                      >
                        {savingVariantId === v.id ? '...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEditVariant}
                        className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      <span className="bg-slate-800/50 sm:bg-transparent p-1.5 sm:p-0 rounded-md">
                        <span className="text-slate-500 block sm:inline">Color:</span>{' '}
                        <strong className="text-slate-200">{getVariantColor(v)}</strong>
                      </span>
                      <span className="bg-slate-800/50 sm:bg-transparent p-1.5 sm:p-0 rounded-md">
                        <span className="text-slate-500 block sm:inline">Size:</span>{' '}
                        <strong className="text-slate-200">{getVariantSize(v)}</strong>
                      </span>
                      <span className="bg-slate-800/50 sm:bg-transparent p-1.5 sm:p-0 rounded-md">
                        <span className="text-slate-500 block sm:inline">Price:</span>{' '}
                        <strong className="text-slate-200">${v.price ?? 0}</strong>
                      </span>
                      <span className="bg-slate-800/50 sm:bg-transparent p-1.5 sm:p-0 rounded-md">
                        <span className="text-slate-500 block sm:inline">Stock:</span>{' '}
                        <strong className="text-slate-200">{v.stock_quantity ?? 0}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => onStartEditVariant(v)}
                        className="text-xs text-indigo-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteVariant(productId, v.id)}
                        className="text-xs text-rose-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* --- Variant Images Section --- */}
                <div className="flex gap-2 flex-wrap items-center pt-2.5 border-t border-slate-800/60">
                  {(v.images || []).map((img) => (
                    <div key={img.id} className="relative group w-14 h-14 shrink-0">
                      <img
                        src={img.image_url}
                        alt="variant"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700/80"
                      />
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center gap-1">
                        <label className="text-[9px] text-indigo-300 underline cursor-pointer hover:text-indigo-200">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onReplaceImage(productId, v.id, img.id, file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => onDeleteImage(productId, v.id, img.id)}
                          className="text-[9px] text-rose-400 underline hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                      {busyImageKey === `replace-${img.id}` && (
                        <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center text-[8px] text-white">
                          ...
                        </div>
                      )}
                    </div>
                  ))}

                  <label className="w-14 h-14 border border-dashed border-slate-700/80 rounded-lg flex items-center justify-center text-[9px] text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition shrink-0">
                    {busyImageKey === `add-${v.id}` ? '...' : '+ Add'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onAddImage(productId, v.id, file);
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Add Variant Section --- */}
      {addingVariantFor === productId ? (
        <div className="p-3 sm:p-4 rounded-xl border border-indigo-500/30 bg-slate-900/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Color</label>
              <input
                type="text"
                value={newVariantDraft.color}
                onChange={(e) => setNewVariantDraft({ ...newVariantDraft, color: e.target.value })}
                className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Size</label>
              <select
                value={newVariantDraft.size}
                onChange={(e) =>
                  setNewVariantDraft({ ...newVariantDraft, size: e.target.value as ProductSize })
                }
                className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
              >
                <option value="">Select Size</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Price ($)</label>
              <input
                type="number"
                value={newVariantDraft.price}
                onChange={(e) => setNewVariantDraft({ ...newVariantDraft, price: e.target.value })}
                className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Stock</label>
              <input
                type="number"
                value={newVariantDraft.stock_quantity}
                onChange={(e) => setNewVariantDraft({ ...newVariantDraft, stock_quantity: e.target.value })}
                className={`w-full text-xs p-2 rounded-lg border outline-none ${inputBg}`}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 md:col-span-1 pt-1 sm:pt-0">
              <button
                type="button"
                disabled={creatingVariant}
                onClick={() => onCreateVariant(productId)}
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg font-bold transition"
              >
                {creatingVariant ? '...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onCancelAddVariant}
                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onStartAddVariant(productId)}
          className="w-full sm:w-auto text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-lg font-bold transition"
        >
          + Add Variant
        </button>
      )}
    </div>
  );
}