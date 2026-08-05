'use client';

import { ReactNode } from 'react'; // 1. Import ReactNode

type OrderStatus = 'paid' | 'pending' | 'unpaid' | 'cancelled';
type OrderItem = { productId: string; productName: string; variantDetails: string; quantity: number; price: number };
type Order = { id: string; customerName: string; customerEmail: string; address: string; date: string; status: OrderStatus; items: OrderItem[]; totalAmount: number };

type OrderTabProps = {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  getStatusBadge: (status: OrderStatus) => ReactNode; // 2. Updated return type
  tableHeaderBg: string;
  borderRow: string;
};

export default function OrderTab({ orders, onSelectOrder, getStatusBadge, tableHeaderBg, borderRow }: OrderTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className={`text-xs uppercase font-bold border-b ${tableHeaderBg}`}>
          <tr>
            <th className="p-3">Order ID</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Date</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {orders.map(order => (
            <tr key={order.id} className={`hover:bg-indigo-500/5 ${borderRow}`}>
              <td className="p-3 font-bold font-mono text-indigo-400">{order.id}</td>
              <td className="p-3 font-medium">{order.customerName}</td>
              <td className="p-3 text-slate-400 text-xs">{order.date}</td>
              <td className="p-3 font-extrabold">${order.totalAmount}</td>
              <td className="p-3">{getStatusBadge(order.status)}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => onSelectOrder(order)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}