'use client';

import { useEffect, useState } from "react";
import { getTopSellingProducts } from "../../services/order.service";
import { ProductVariantRanked, TopSellingTabProps } from "../../type";



export default function TopSellingTab({ products: initialProducts = [], tableHeaderBg, borderRow }: TopSellingTabProps) {
  const [productList, setProductList] = useState<ProductVariantRanked[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch API handler
  const fetchTopSelling = async () => {
    setLoading(true);
    try {
      const response = await getTopSellingProducts();
      // Adjust array mapping based on API response structure (e.g., response.products or response.All_categories)
      setProductList(response?.data || response || []);
    } catch (error) {
      console.error('Failed to fetch top selling products:', error);
      setProductList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSelling();
  }, []);

  // console.log(productList);
  // Sort products by total units sold or custom sales metric
  const sortedProducts = [...productList].sort(
    (a, b) => Number(b.totalUnitsSold || 0) - Number(a.totalUnitsSold || 0),
  );

  return (
    <div className="w-full">
      {/* ================= DESKTOP & LAPTOP VIEW (TABLE) ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Product Info</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Units / Orders</th>
              <th className="p-3 text-right">Avg Price</th>
              <th className="p-3 text-right">Total Revenue</th>
              <th className="p-3 text-right">Revenue Share</th>
              <th className="p-3 text-center">Stock / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-xs text-slate-400">
                  No products available to rank.
                </td>
              </tr>
            ) : (
              sortedProducts.map((p) => {
                const totalRevenue = Number(p.totalRevenueGenerated || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const avgPrice = Number(p.avgSellingPrice || p.basePrice || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const sharePercent = Number(p.revenueSharePercent || 0).toFixed(1);

                return (
                  <tr key={`${p.productId}-${p.variantId}`} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                    <td className="p-3 font-mono font-bold text-indigo-400">
                      #{p.rank}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-100">{p.productName}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>ID: #{p.productId}</span>
                        {p.variantLabel && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                              {p.variantLabel}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">
                      {p.categoryName || "Uncategorized"}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      <div>{p.totalUnitsSold} <span className="text-xs text-slate-400">units</span></div>
                      <div className="text-xs text-slate-400 font-normal">
                        {p.totalOrders} {p.totalOrders === 1 ? "order" : "orders"}
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono text-slate-300">
                      ${avgPrice}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ${totalRevenue}
                    </td>

                    <td className="p-3 text-right">
                      <div className="font-mono text-xs font-semibold text-indigo-300">
                        {sharePercent}%
                      </div>
                      <div className="w-24 ml-auto bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(Number(sharePercent), 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-semibold text-slate-200">
                        {p.variantStock ?? p.currentStock} <span className="text-[10px] text-slate-400">in stock</span>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase mt-0.5 ${p.productStatus === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                      >
                        {p.productStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW (CARDS) ================= */}
      <div className="block md:hidden space-y-3">
        {sortedProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
            No products available to rank.
          </div>
        ) : (
          sortedProducts.map((p) => {
            const totalRevenue = Number(p.totalRevenueGenerated || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const avgPrice = Number(p.avgSellingPrice || p.basePrice || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const sharePercent = Number(p.revenueSharePercent || 0).toFixed(1);

            return (
              <div
                key={`${p.productId}-${p.variantId}`}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                {/* Header: Rank, Name, Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      #{p.rank}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{p.productName}</h4>
                      <span className="text-xs text-slate-400">{p.categoryName} • ID: #{p.productId}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${p.productStatus === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                  >
                    {p.productStatus}
                  </span>
                </div>

                {/* Variant Tag if exists */}
                {p.variantLabel && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Variant:</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200">
                      {p.variantLabel}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      Stock: <strong className="text-slate-200">{p.variantStock ?? p.currentStock}</strong>
                    </span>
                  </div>
                )}

                {/* Grid Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Total Revenue</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">${totalRevenue}</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Avg Selling Price</span>
                    <span className="font-mono font-semibold text-slate-200 text-sm">${avgPrice}</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Sold / Orders</span>
                    <span className="font-semibold text-slate-200">{p.totalUnitsSold} units</span>
                    <span className="text-slate-400 text-[10px] block">({p.totalOrders} orders)</span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Revenue Share</span>
                    <span className="font-mono font-semibold text-indigo-300">{sharePercent}%</span>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${Math.min(Number(sharePercent), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}