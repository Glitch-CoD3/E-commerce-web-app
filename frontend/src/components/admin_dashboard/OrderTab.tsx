'use client';

import { ReactNode, useEffect, useState } from 'react';
import { getAllOrdersAdmin } from '../../services/order.service';
import { formatRelativeTime } from '../../services/timeformate.js';
import { getUserById } from '../../services/user.service';

import { OrderStatus, OrderItem, RawOrder, Order, OrderTabProps } from '../../type'

const getCustomerBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "⏳";

    case "shipped":
      return "🚚";

    case "cancelled":
      return "❌";

    case "paid":
      return "💳";

    default:
      return "👤";
  }
};


export default function OrderTab({
  onSelectOrder,
  getStatusBadge,
  tableHeaderBg,
  borderRow,
}: OrderTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrdersAndUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch all orders
        const data = await getAllOrdersAdmin();
        const rawOrders: RawOrder[] = data.orders || [];

        // 2. Extract UNIQUE user IDs to prevent redundant requests
        const uniqueUserIds = Array.from(
          new Set(rawOrders.map((order) => order.user_id).filter(Boolean))
        );

        // 3. Fetch user info only once per unique user ID
        const userMap = new Map<string, { full_name?: string; email?: string }>();

        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const userRes = await getUserById(userId);
              if (userRes?.user) {
                userMap.set(userId, userRes.user);
              }
            } catch (err) {
              console.error(`Failed to fetch user ID ${userId}:`, err);
            }
          })
        );

        // 4. Map user details back to each order using cached Map lookup
        const formattedOrders: Order[] = rawOrders.map((order) => {
          const user = userMap.get(order.user_id);

          return {
            ...order,
            address: order.address || '',
            customerName: user?.full_name || order.customerName || 'Unknown Customer',
            customerEmail: user?.email || order.customerEmail || 'N/A',
          };
        });

        if (isMounted) {
          setOrders(formattedOrders);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch orders'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrdersAndUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  const shippedCount = orders.filter((order) => order.status === 'shipped').length;



  return (
    <div className="space-y-6">
      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Orders</p>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                {orders.length}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-2xl">
              📦
            </div>
          </div>
          <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
        </div>

        {/* Paid Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Paid Orders</p>
              <h2 className="mt-2 text-3xl font-extrabold text-emerald-400">
                {orders.filter((order) => order.status === 'paid').length}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl">
              ✓
            </div>
          </div>
          <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
        </div>

        {/* Shipped Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Shipped Orders</p>
              <h2 className="mt-2 text-3xl font-extrabold text-blue-400">
                {shippedCount}
              </h2>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-2xl">
              🚚
              {shippedCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-lg">
                  {shippedCount}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm">
        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className={`sticky top-0 z-10 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-md ${tableHeaderBg}`}>
              <tr>
                <th scope="col" className="px-4 py-3.5">Order ID</th>
                <th scope="col" className="px-4 py-3.5">Customer</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-4 py-3.5">Total</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl">📥</span>
                      <p className="text-sm font-medium text-slate-400">No orders found</p>
                      <p className="text-xs text-slate-500">New orders will show up here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`group transition-colors duration-150 hover:bg-slate-800/40 ${borderRow}`}
                  >
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-indigo-400">
                      <span className="rounded bg-indigo-500/10 px-2 py-1 transition-colors group-hover:bg-indigo-500/20">
                        #{String(order.id || '').slice(-8)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-base ring-1 ring-slate-700/50">
                          {getCustomerBadge(order.status)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">
                            {order.customerName}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {order.customerEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      className="px-4 py-4 whitespace-nowrap text-xs text-slate-400"
                      title={new Date(order.created_at).toLocaleString()}
                    >
                      {formatRelativeTime(order.created_at)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-100">
                      ${order.net_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/20 active:scale-95"
                      >
                        <span>View Details</span>
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="divide-y divide-slate-800/80 md:hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No orders found.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="space-y-3 p-4 hover:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-indigo-500/10 px-2 py-1 transition-colors group-hover:bg-indigo-500/20">
                    #{String(order.id).slice(-8)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-100">{order.customerName}</div>
                    <div className="text-xs text-slate-400">{order.customerEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-100">${order.net_amount}</div>
                    <div className="text-xs text-slate-400">{formatRelativeTime(order.created_at)}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="w-full rounded-lg bg-indigo-600/90 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}