'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Adjust these import paths according to your actual folder structure
import { getOrderByOrderId } from '../../../../../services/order.service';
import { getUserById } from '../../../../../services/user.service';
import { getVariantImageById, getProductByVarientId } from '../../../../../services/product.service';
import OrderDetails from '../../../../../components/admin_dashboard/OrderDetails';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  // Extract orderId from the dynamic route parameter [id]
  const orderId = params?.id as string;

  const [orderData, setOrderData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [variantImages, setVariantImages] = useState<Record<string | number, string>>({});
  const [productsMap, setProductsMap] = useState<Record<string | number, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true; // Prevents state updates on unmounted component

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order data
        const data = await getOrderByOrderId(orderId);
        if (!isMounted) return;
        setOrderData(data);

         // Extract order details safely
        const orderDetailsArray = data?.order_result?.order_details || [];
        const orderDetails = orderDetailsArray;

        // Use the local variable 'orderDetails' or 'data', NOT state 'orderData'
        const userId = orderDetails?.user_id;

        // Fetch user details if userId exists
        if (userId) {
          try {
            const customer: any = await getUserById(userId);
            if (isMounted) {
              setCustomerData(customer?.data || customer?.user || customer);
            }
          } catch (userErr) {
            console.error(`Failed to fetch user ${userId}:`, userErr);
          }
        }

        // Fetch variant images and product details concurrently for each item
        const items = data?.order_result?.Order_items || [];

        if (items.length > 0) {
          // Deduplicate variant IDs to avoid duplicate API requests
          const uniqueVariantIds = Array.from(
            new Set(
              items
                .map((item: any) => item?.product_variant_id )
                .filter(Boolean)
            )
          ) as (string | number)[];

          const itemDetailsPromises = uniqueVariantIds.map(async (variantId) => {
            try {
              const numericVariantId = Number(variantId);
              const [imageResponse, productResponse] = await Promise.allSettled([
                getVariantImageById(numericVariantId),
                getProductByVarientId(numericVariantId),
              ]);

              const imageUrl =
                imageResponse.status === 'fulfilled'
                  ? imageResponse.value?.data?.[0]?.image_url || null
                  : null;

              const productData =
                productResponse.status === 'fulfilled'
                  ? productResponse.value?.data || productResponse.value?.product || productResponse.value
                  : null;

              return { variantId, imageUrl, productData };
            } catch (err) {
              console.error(`Failed fetching details for variant ${variantId}:`, err);
              return { variantId, imageUrl: null, productData: null };
            }
          });

          const resolvedDetails = await Promise.all(itemDetailsPromises);

          if (isMounted) {
            const imageMap: Record<string | number, string> = {};
            const prodMap: Record<string | number, any> = {};

            resolvedDetails.forEach((res) => {
              if (res.variantId) {
                if (res.imageUrl) imageMap[res.variantId] = res.imageUrl;
                if (res.productData) prodMap[res.variantId] = res.productData;
              }
            });

            setVariantImages(imageMap);
            setProductsMap(prodMap);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch order details'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false; // Cleanup flag
    };
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

  // Attach fetched images & product details to each item
  const itemsWithDetails = rawItems.map((item: any) => {
    const variantId = item?.variant_id || item?.product_variant_id || item?.variantId;
    return {
      ...item,
      image_url: variantImages[variantId] || item?.image_url || null,
      product: productsMap[variantId] || null,
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
          items={itemsWithDetails}
          shippingAddress={orderData?.order_result?.shipping_address || []}
          customer={customerData}
          images={variantImages}
          productsVarients={productsMap}
        />
      </div>
    </div>
  );
}