import React, { useState, useMemo } from 'react';
import VariantPanel from './VariantPanel';
import { PaginatedProductTableProps } from '../../../services/product.service';

export default function ProductTable({
  products = [],
  pagination,
  isFetchingData,
  tableHeaderBg = 'bg-slate-900',
  borderRow = 'border-slate-800',
  inputBg,
  expandedProductId,
  variantsByProduct,
  loadingVariantsFor,
  onToggleVariants,
  onEditProduct,
  onDeleteProduct,
  hasMore = false,
  onLoadMore,
  onPageChange,
  onCategoryChange,
  ...variantPanelProps
}: PaginatedProductTableProps & { onPageChange?: (page: number) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract metadata directly from pagination object
  const currentPage = pagination?.current_page ?? 1;
  const totalPages = pagination?.total_pages ?? 1;
  const totalProductsCount = pagination?.total_products ?? products.length;

  // Category counts based on currently loaded chunk
  const loadedCategoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      perfume: 0,
      watch: 0,
      sunglass: 0,
    };

    products.forEach((p: any) => {
      const catName = (p?.category_name || p?.category_slug || p?.category_id || '').toString().toLowerCase();
      if (catName.includes('perfume')) counts.perfume += 1;
      if (catName.includes('watch')) counts.watch += 1;
      if (catName.includes('sunglass') || catName.includes('glass')) counts.sunglass += 1;
    });

    return counts;
  }, [products]);

  const categories = [
    { key: 'all', label: 'All Products', count: totalProductsCount },
    { key: 'perfume', label: 'Perfume', count: loadedCategoryCounts.perfume },
    { key: 'watch', label: 'Watch', count: loadedCategoryCounts.watch },
    { key: 'sunglass', label: 'Sunglass', count: loadedCategoryCounts.sunglass },
  ];

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    if (onCategoryChange) {
      onCategoryChange(categoryKey);
    }
  };

  const hasMorePages = hasMore || currentPage < totalPages;
  const handleLoadMoreClick = () => {
    if (onLoadMore) {
      onLoadMore();
    } else if (onPageChange) {
      onPageChange(currentPage + 1);
    }
  };
  const canLoadMore = hasMorePages && (!!onLoadMore || !!onPageChange);

  return (
    <div className="space-y-4 w-full">
      {/* Category Tabs & Total Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700 text-slate-300'
                    }`}
                >
                  {cat.key === 'all' ? cat.count : `${cat.count} loaded`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 shrink-0">
          Total Products: <span className="font-bold text-white">{totalProductsCount}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {isFetchingData && products.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
          Loading datasets...
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
          No products found.
        </div>
      ) : (
        <>
          {/* ================= DESKTOP & LAPTOP TABLE VIEW (md and up) ================= */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className={`text-xs uppercase font-bold border-b border-slate-800 ${tableHeaderBg}`}>
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
                {products.map((p, index) => {
                  const loadedVariants = variantsByProduct[p.id];
                  const variantCount =
                    loadedVariants?.length ??
                    (p as { total_variants?: number }).total_variants ??
                    0;
                  const isExpanded = expandedProductId === p.id;
                  const brandName = (p as any)?.brand_name ?? (p as any)?.brand ?? '—';
                  const categoryName = (p as any)?.category_name ?? p.category_id ?? '—';

                  return (
                    <React.Fragment key={p?.id ? `prod-${p.id}` : index}>
                      <tr className={`hover:bg-indigo-500/5 transition ${borderRow}`}>
                        <td className="p-3 font-bold text-white">{p.name || '—'}</td>
                        <td className="p-3 text-xs text-slate-400">{categoryName}</td>
                        <td className="p-3 text-xs text-slate-400">{brandName}</td>
                        <td className="p-3 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                              }`}
                          >
                            {p.status || 'inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          <button
                            type="button"
                            onClick={() => onToggleVariants(p.id)}
                            className={`font-mono px-2.5 py-1 rounded-md border transition ${isExpanded
                                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                : 'border-slate-700 text-indigo-400 hover:bg-indigo-600/10'
                              }`}
                          >
                            {variantCount} Variant{variantCount === 1 ? '' : 's'} {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                        <td className="p-3 font-bold text-white">{p.stock_quantity ?? 0}</td>
                        <td className="p-3 text-right space-x-2">
                          <button onClick={() => onEditProduct(p)} className="text-xs text-indigo-400 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => onDeleteProduct(p.id)} className="text-xs text-rose-500 hover:underline">
                            Delete
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className={borderRow}>
                          <td colSpan={7} className="p-0 bg-slate-900/40">
                            <VariantPanel
                              productId={p.id}
                              isLoading={loadingVariantsFor === p.id}
                              variants={loadedVariants || []}
                              inputBg={inputBg}
                              {...variantPanelProps}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE & TABLET CARD VIEW (below md) ================= */}
          <div className="md:hidden space-y-3">
            {products.map((p, index) => {
              const loadedVariants = variantsByProduct[p.id];
              const variantCount =
                loadedVariants?.length ??
                (p as { total_variants?: number }).total_variants ??
                0;
              const isExpanded = expandedProductId === p.id;
              const brandName = (p as any)?.brand_name ?? (p as any)?.brand ?? '—';
              const categoryName = (p as any)?.category_name ?? p.category_id ?? '—';

              return (
                <div
                  key={p?.id ? `mobile-prod-${p.id}` : index}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm"
                >
                  {/* Top Header: Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">{p.name || '—'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {categoryName} • <span className="text-slate-300">{brandName}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${p.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}
                    >
                      {p.status || 'inactive'}
                    </span>
                  </div>

                  {/* Stock Details */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-400">Total Stock</span>
                    <span className="font-bold text-white text-sm">{p.stock_quantity ?? 0}</span>
                  </div>

                  {/* Actions & Variants Toggle */}
                  <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onToggleVariants(p.id)}
                      className={`font-mono text-xs px-3 py-1.5 rounded-md border transition flex items-center gap-1 ${isExpanded
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                          : 'border-slate-700 text-indigo-400 hover:bg-indigo-600/10'
                        }`}
                    >
                      <span>{variantCount} Variant{variantCount === 1 ? '' : 's'}</span>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="px-2.5 py-1 text-indigo-400 font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="px-2.5 py-1 text-rose-500 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Mobile Variant Panel Container */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 -mx-1">
                      <VariantPanel
                        productId={p.id}
                        isLoading={loadingVariantsFor === p.id}
                        variants={loadedVariants || []}
                        inputBg={inputBg}
                        {...variantPanelProps}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 pb-4 px-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 text-center sm:text-left">
          Loaded <span className="font-semibold text-slate-200">{products.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalProductsCount}</span> products (Page {currentPage} of {totalPages})
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
          {/* Previous Page Button */}
          {onPageChange && (
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isFetchingData}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-center"
            >
              Previous
            </button>
          )}

          {/* Load More Button */}
          {canLoadMore && (
            <button
              type="button"
              onClick={handleLoadMoreClick}
              disabled={isFetchingData}
              className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-center"
            >
              {isFetchingData
                ? 'Loading...'
                : `Load More (${currentPage + 1}/${totalPages})`}
            </button>
          )}

          {/* Next Page Button */}
          {onPageChange && (
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isFetchingData}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-center"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}