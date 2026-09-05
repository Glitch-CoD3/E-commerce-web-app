'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Adjust these import paths according to your actual folder structure
import { getOrderByOrderId } from '../../../../../services/order.service';
import { getUserById } from '../../../../../services/user.service';
import { getVariantImageById } from '../../../../../services/product.service';
import OrderDetails from '../../../../../components/admin_dashboard/OrderDetails';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  // Extract orderId from the dynamic route parameter [id]
  const orderId = params?.id as string;

  const [orderData, setOrderData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [variantImages, setVariantImages] = useState<Record<string | number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order data
        const data = await getOrderByOrderId(orderId);
        setOrderData(data);

        // Extract order details & customer ID
        const orderDetailsArray = data?.order_result?.order_details || [];
        const orderDetails = orderDetailsArray[0] || data?.order;
        const userId = orderDetails?.user_id;

        // Fetch user details if userId exists
        if (userId) {
          const customer = await getUserById(userId);
          setCustomerData(customer?.data || customer?.user || customer);
        }

        // Fetch variant images for each item in the order
        const items = data?.order_result?.Order_items || [];

        if (items.length > 0) {
          const imagePromises = items.map(async (item: any) => {
            const variantId = item?.variant_id || item?.product_variant_id || item?.variantId;
            if (!variantId) return null;

            try {
              const imageResponse = await getVariantImageById(variantId);
              
              // Extract image_url from data array based on response payload structure
              const imageUrl =
                imageResponse?.data?.[0]?.image_url ||
                null;

              return { variantId, imageUrl };
            } catch (imgErr) {
              console.error(`Failed to fetch image for variant ${variantId}:`, imgErr);
              return { variantId, imageUrl: null };
            }
          });

          const resolvedImages = await Promise.all(imagePromises);

          // Build a map of { [variantId]: imageUrl }
          const imageMap: Record<string | number, string> = {};
          resolvedImages.forEach((res) => {
            if (res && res.variantId && res.imageUrl) {
              imageMap[res.variantId] = res.imageUrl;
            }
          });

          setVariantImages(imageMap);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch order details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-xs font-medium">Loading order #{orderId}...</p>
      </div>
    );
  }

  // Error State
  if (error || !orderData) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
        <p className="text-xs font-medium text-rose-400">
          {error || 'Order details not found.'}
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  // Raw items array safely retrieved
  const rawItems = orderData?.order_result?.Order_items || orderData?.order_result?.order_items || [];

  // Attach fetched images to each item
  const itemsWithImages = rawItems.map((item: any) => {
    const variantId = item?.variant_id || item?.product_variant_id || item?.variantId;
    return {
      ...item,
      image_url: variantImages[variantId] || item?.image_url || null,
    };
  });

  return (
    <div className="min-h-screen w-full flex flex-col p-4 sm:p-6 space-y-6 bg-slate-600 text-slate-100">
      {/* Top Header / Back Button */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
        >
          ← Back to Orders
        </button>
        <span className="font-mono text-xs text-slate-400">
          ID: {orderId}
        </span>
      </div>

      {/* View Component Call Container */}
      <div className="flex-1 w-full min-h-0 flex flex-col">
        <OrderDetails
          order={orderData?.order_result?.order_details || []}
          items={itemsWithImages}
          shippingAddress={orderData?.order_result?.shipping_address || []}
          customer={customerData}
          images = {variantImages}
        />
      </div>
    </div>
  );
}