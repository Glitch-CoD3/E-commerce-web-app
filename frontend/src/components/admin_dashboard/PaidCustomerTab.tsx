'use client';

type OrderItem = { productId: string; productName: string; variantDetails: string; quantity: number; price: number };
type Order = { id: string; customerName: string; customerEmail: string; address: string; date: string; status: 'paid' | 'pending' | 'unpaid' | 'cancelled'; items: OrderItem[]; totalAmount: number };

type PaidCustomerTabProps = {
  paidOrders: Order[];
  tableHeaderBg: string;
  borderRow: string;
};

export default function PaidCustomerTab({ paidOrders, tableHeaderBg, borderRow }: PaidCustomerTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
          <tr>
            <th className="p-3">Customer Name</th>
            <th className="p-3">Email Address</th>
            <th className="p-3">Shipping Address</th>
            <th className="p-3">Last Order Date</th>
            <th className="p-3">Total Paid</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {paidOrders.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-xs text-slate-400">
                No paid orders found yet.
              </td>
            </tr>
          ) : (
            paidOrders.map(order => (
              <tr key={order.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
                <td className="p-3 font-bold">{order.customerName}</td>
                <td className="p-3 text-xs text-indigo-400">{order.customerEmail}</td>
                <td className="p-3 text-xs text-slate-400 max-w-xs truncate">{order.address}</td>
                <td className="p-3 text-xs text-slate-400">{order.date}</td>
                <td className="p-3 font-black text-emerald-500">${order.totalAmount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}