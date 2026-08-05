'use client';

type Variant = { id: string; color: string; size: string; price: number; stock: number };
type Product = { id: string; name: string; category: string; totalQuantity: number; variants: Variant[] };

type TopSellingTabProps = {
  products: Product[];
  tableHeaderBg: string;
  borderRow: string;
};

export default function TopSellingTab({ products, tableHeaderBg, borderRow }: TopSellingTabProps) {
  // Sort products by total quantity or custom sales metric
  const sortedProducts = [...products].sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
          <tr>
            <th className="p-3">Rank</th>
            <th className="p-3">Product Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Available Stock</th>
            <th className="p-3">Price Range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {sortedProducts.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-xs text-slate-400">
                No products available to rank.
              </td>
            </tr>
          ) : (
            sortedProducts.map((p, index) => {
              const prices = p.variants?.map(v => v.price) || [0];
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceDisplay = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;

              return (
                <tr key={p.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                  <td className="p-3 font-mono font-bold text-indigo-400">#{index + 1}</td>
                  <td className="p-3 font-bold">{p.name}</td>
                  <td className="p-3 text-xs text-slate-400">{p.category || '—'}</td>
                  <td className="p-3 font-semibold">{p.totalQuantity} units</td>
                  <td className="p-3 text-xs font-bold text-emerald-400">{priceDisplay}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}