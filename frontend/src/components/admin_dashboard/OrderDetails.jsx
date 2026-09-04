"use client";

import { updateOrderStatus, updatePaymentStatus } from "@/src/services/order.service";
import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  User,
  CreditCard,
  Loader2,
  RotateCcw
} from "lucide-react";
import { formatRelativeTime } from '../../services/timeformate';

const STATUS_CONFIG = {
  pending: { label: "Pending", badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20", Icon: Clock },
  processing: { label: "Processing", badgeClass: "bg-blue-50 text-blue-700 ring-blue-700/10", Icon: Package },
  shipped: { label: "Shipped", badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-700/10", Icon: Truck },
  delivered: { label: "Delivered", badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: CheckCircle2 },
  confirmed: { label: "Confirmed", badgeClass: "bg-blue-50 text-blue-700 ring-blue-700/10", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/10", Icon: XCircle },
  returned: { label: "Returned", badgeClass: "bg-purple-50 text-purple-700 ring-purple-600/10", Icon: RotateCcw },

  // Payment Status Enums (Uppercase)
  PAID: { label: "Paid", badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: CheckCircle2 },
  UNPAID: { label: "Unpaid", badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/10", Icon: XCircle },

  // Lowercase fallbacks for payment status badges
  paid: { label: "Paid", badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: CheckCircle2 },
  unpaid: { label: "Unpaid", badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/10", Icon: XCircle }
};

const formatCurrency = (value) => {
  const n = Number(value ?? 0);
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

function StatusBadge({ status }) {
  const key = String(status || "pending");
  const config = STATUS_CONFIG[key] || STATUS_CONFIG[key.toLowerCase()] || STATUS_CONFIG.pending;
  const { Icon } = config;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${config.badgeClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function CopyableOrderNumber({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore copy errors
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-950 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md active:scale-95 duration-150 cursor-pointer"
      title="Click to copy order ID"
    >
      <span>{value}</span>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function OrderDetails(props) {
  const order = props?.order?.[0] || props?.order || {};
  const items = props?.items || [];
  const shippingAddress = props?.shippingAddress || {};
  const customer = props?.customer || {};
  const images = props?.images || {}; // Access the images map prop

  // Extract root-level variables
  const id = order?.id;
  const initialPaymentStatus = order?.payment_status || "UNPAID";
  const orderNumber = order?.order_number || (order?.id ? `ORD-#${order.id}` : "N/A");
  const createdAt = order?.created_at || new Date().toISOString();
  const initialStatus = order?.status || order?.order_status || "pending";

  const subtotal = Number(order?.total_amount || 0);
  const discount = Number(order?.discount_amount || 0);
  const shippingFee = Number(order?.shipping_charge || 0);
  const net = Number(order?.net_amount || 0);

  // Local state for UI responsiveness during updates
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(initialPaymentStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Synchronize local state when server/parent updates the order prop
  useEffect(() => {
    if (order?.status || order?.order_status) {
      setCurrentStatus(order?.status || order?.order_status);
    }
    if (order?.payment_status) {
      setCurrentPaymentStatus(order?.payment_status);
    }
  }, [order?.status, order?.payment_status]);

  // Handle Payment Status Update API call
  const onPaymentChange = async (newStatus) => {
    if (!id || updatingStatus) return;
    setUpdatingStatus(true);

    try {
      await updatePaymentStatus(id, newStatus);
      setCurrentPaymentStatus(newStatus);
      if (props.onUpdatePaymentStatus) {
        await props.onUpdatePaymentStatus(newStatus);
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Order Status Update API call
  const onOrderChange = async (newStatus) => {
    if (!id || updatingStatus) return;
    setUpdatingStatus(true);

    try {
      await updateOrderStatus(id, newStatus);
      setCurrentStatus(newStatus);
      if (props.onUpdateOrderStatus) {
        await props.onUpdateOrderStatus(newStatus);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper to resolve the image URL for an item
  const getItemImage = (item) => {
    const variantId = item?.variant_id || item?.product_variant_id || item?.variantId;
    return (
      item?.image_url ||
      (variantId ? images[variantId] : null) ||
      item?.product_image ||
      item?.productImage ||
      item?.image ||
      item?.product?.image
    );
  };

  return (
    <div className="min-h-full w-full overflow-hidden rounded-2xl border border-slate-600 bg-slate-700 shadow-2xl flex flex-col justify-between text-slate-100">

      {/* Top Wrapper for Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-slate-600 bg-slate-800/80 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl mb-3">
                Order Details
              </h1>

              {/* Labeled Badges */}
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Order Status:</span>
                  <StatusBadge status={currentStatus} />
                </div>
                {currentPaymentStatus && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Payment Status:</span>
                    <StatusBadge status={currentPaymentStatus} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span>Placed on {formatDate(createdAt)}</span>
                  <span className="text-slate-500">•</span>
                  <CopyableOrderNumber value={orderNumber} />
                </div>
                <span className="text-xs text-sky-300 font-semibold pl-0.5">
                  ({formatRelativeTime(createdAt)})
                </span>
              </div>
            </div>

            {/* Action Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start sm:self-auto bg-slate-800 border border-slate-600 p-2.5 rounded-xl shadow-md">
              {/* Payment Status Dropdown */}
              <div className="flex flex-col gap-1">
                <label htmlFor="paymentStatusSelect" className="text-[10px] font-extrabold tracking-wider text-sky-300 uppercase flex items-center gap-1">
                  Payment Status
                  {updatingStatus && <Loader2 className="h-2.5 w-2.5 animate-spin text-sky-300" />}
                </label>
                <select
                  id="paymentStatusSelect"
                  disabled={updatingStatus}
                  value={String(currentPaymentStatus).toUpperCase()}
                  onChange={(e) => onPaymentChange(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 capitalize cursor-pointer disabled:opacity-50 transition-all"
                >
                  {['UNPAID', 'PAID'].map((st) => (
                    <option key={st} value={st} className="bg-slate-800 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Status Dropdown */}
              <div className="flex flex-col gap-1">
                <label htmlFor="orderStatusSelect" className="text-[10px] font-extrabold tracking-wider text-sky-300 uppercase flex items-center gap-1">
                  Order Status
                  {updatingStatus && <Loader2 className="h-2.5 w-2.5 animate-spin text-sky-300" />}
                </label>
                <select
                  id="orderStatusSelect"
                  disabled={updatingStatus}
                  value={String(currentStatus).toLowerCase()}
                  onChange={(e) => onOrderChange(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 capitalize cursor-pointer disabled:opacity-50 transition-all"
                >
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((st) => (
                    <option key={st} value={st} className="bg-slate-800 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Items Section */}
        <div className="p-6 sm:p-8">
          <h2 className="text-base font-bold text-white mb-4 tracking-wide">
            Items Ordered ({items.length || 0})
          </h2>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-600 bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-300">
                <tr>
                  <th scope="col" className="py-3 px-4">Item</th>
                  <th scope="col" className="py-3 px-4 text-center">Qty</th>
                  <th scope="col" className="py-3 px-4 text-right">Price</th>
                  <th scope="col" className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600/60">
                {items.map((item, idx) => {
                  const name = item?.product_name || item?.productName || item?.title || item?.product?.name || "Unnamed Product";
                  const image = getItemImage(item);
                  const price = Number(item?.price || item?.unit_price || item?.unitPrice || 0);
                  const qty = Number(item?.quantity || item?.qty || 1);
                  const itemTotal = Number(item?.total_amount || item?.totalAmount || item?.subtotal || price * qty);
                  const color = item?.color || item?.variant?.color;
                  const size = item?.size || item?.variant?.size;
                  const hasVariant = Boolean(color || size);

                  return (
                    <tr key={item?.id || idx} className="group hover:bg-slate-600/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-500 bg-slate-800">
                            {image ? (
                              <img src={image} alt={name} className="h-full w-full object-cover object-center" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                              {name}
                            </p>
                            {hasVariant && (
                              <p className="mt-0.5 text-xs text-slate-300">
                                {[color, size].filter(Boolean).join(" / ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-100">{qty}</td>
                      <td className="py-4 px-4 text-right text-slate-300">{formatCurrency(price)}</td>
                      <td className="py-4 px-4 text-right font-bold text-white">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="divide-y divide-slate-600/60 sm:hidden">
            {items.map((item, idx) => {
              const name = item?.product_name || item?.productName || item?.title || item?.product?.name || "Unnamed Product";
              const image = getItemImage(item);
              const price = Number(item?.price || item?.unit_price || item?.unitPrice || 0);
              const qty = Number(item?.quantity || item?.qty || 1);
              const itemTotal = Number(item?.total_amount || item?.totalAmount || item?.subtotal || price * qty);
              const color = item?.color || item?.variant?.color;
              const size = item?.size || item?.variant?.size;
              const hasVariant = Boolean(color || size);

              return (
                <div key={item?.id || idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-500 bg-slate-800">
                    {image ? (
                      <img src={image} alt={name} className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{name}</p>
                      {hasVariant && (
                        <p className="mt-0.5 text-xs text-slate-300">
                          {[color, size].filter(Boolean).join(" / ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-300">
                        Qty: <span className="font-bold text-white">{qty}</span> × {formatCurrency(price)}
                      </span>
                      <span className="font-bold text-sky-300 text-sm">{formatCurrency(itemTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Details */}
      <div className="border-t border-slate-600 bg-slate-800/80 p-6 sm:p-8 w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">

            {/* Shipping Address */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                <MapPin className="h-4 w-4 text-sky-300" /> Shipping Address
              </h3>
              <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 text-sm text-slate-200 shadow-sm">
                <p className="font-semibold text-white">
                  {shippingAddress?.full_address || "No address provided"}
                </p>
                <p className="text-slate-300 mt-0.5">
                  {[shippingAddress?.city, shippingAddress?.state].filter(Boolean).join(", ")}
                  {shippingAddress?.zip_code ? ` - ${shippingAddress.zip_code}` : ""}
                </p>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                <User className="h-4 w-4 text-sky-300" /> Customer Information
              </h3>
              <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 text-sm text-slate-200 shadow-sm space-y-2">
                <p className="font-semibold text-white">
                  {customer?.full_name || "Guest Customer"}
                </p>
                {customer?.phone_number && (
                  <p className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{customer.phone_number}</span>
                  </p>
                )}
                {customer?.email && (
                  <p className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{customer.email}</span>
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Summary Section - Highlighted Card */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-300 mb-2">
                <CreditCard className="h-4 w-4 text-sky-300" /> Order Summary
              </h3>
              <div className="rounded-xl border-2 border-sky-400/40 bg-slate-800/90 p-5 shadow-lg space-y-3.5">
                <div className="flex justify-between text-sm font-medium text-slate-200">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-200">
                  <span>Discount</span>
                  <span className="font-bold text-emerald-400">- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-200">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-white">{formatCurrency(shippingFee)}</span>
                </div>
                <div className="pt-3 border-t-2 border-slate-600 flex justify-between items-center">
                  <span className="text-base font-extrabold text-white">Total Paid</span>
                  <span className="text-xl font-black text-sky-300 tracking-tight">{formatCurrency(net)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}