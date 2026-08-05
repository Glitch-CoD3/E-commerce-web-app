'use client';

import { ReactNode } from 'react'; // 1. Import ReactNode

type OrderStatus = 'paid' | 'pending' | 'unpaid' | 'cancelled';
type OrderItem = { productId: string; productName: string; variantDetails: string; quantity: number; price: number };
type Order = { id: string; customerName: string; customerEmail: string; address: string; date: string; status: OrderStatus; items: OrderItem[]; totalAmount: number };

type OrderModalProps = {
  order: Order;
  onClose: () => void;
  getStatusBadge: (status: OrderStatus) => ReactNode; // 2. Updated return type
  cardBg: string;
  formSubBg: string;
};

export default function OrderModal({ order, onClose, getStatusBadge, cardBg, formSubBg }: OrderModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
      <div className={`${cardBg} rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border`}>
        <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              Order Details <span className="text-indigo-400 font-mono">({order.id})</span>
            </h3>
            <p className="text-xs text-slate-400">Date: {order.date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold px-2">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Customer:</span>
            <span className="font-bold">{order.customerName}</span>
            <span className="block text-slate-400">{order.customerEmail}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Status:</span>
            {getStatusBadge(order.status)}
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block font-semibold">Shipping Address:</span>
            <span>{order.address}</span>
          </div>
        </div>

        <div className="border-t border-slate-800/40 pt-3">
          <span className="text-xs font-bold block mb-2">Purchased Items:</span>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {order.items.map((item, i) => (
              <div key={i} className={`flex justify-between items-center text-xs p-2.5 rounded-xl border ${formSubBg}`}>
                <div>
                  <div className="font-bold">{item.productName}</div>
                  <div className="text-slate-400">{item.variantDetails}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">${item.price} × {item.quantity}</div>
                  <div className="font-extrabold text-indigo-400">${item.price * item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-800/40 pt-3 text-sm font-bold">
          <span>Total Amount:</span>
          <span className="text-emerald-500 font-black text-lg">${order.totalAmount}</span>
        </div>

        <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20">
          Close Window
        </button>
      </div>
    </div>
  );
}