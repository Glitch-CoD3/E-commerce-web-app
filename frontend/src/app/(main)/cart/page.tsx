"use client";

import PaymentForm from "@/src/components/PaymentForm";
import ShippingForm from "@/src/components/ShippingFrom";
import { ShippingFormInputs } from "@/src/type";
import { ArrowRight, Trash2, Loader2, Minus, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { handleApiError } from "../../../services/handleApiError";

import {
  CartType,
  getAllCarts,
  updateCartQuantity,
  removeCartItem,
  clearCart,
} from "@/src/services/cart.service";

import {
  getProductById,
  getProductByVarientId,
  getVariantImageById,
} from "@/src/services/product.service";

type PopulatedCartItem = CartType & {
  productData?: {
    id: number;
    product_name: string;
    shortDescription: string;
    description: string;
    price: string;
    category_name: string;
    brand_name: string;
    quantity?: string | number;
  } | null;
  variantDetails?: {
    id: number;
    colors: string;
    sizes: string;
    price: string;
    stock_quantity: number;
  } | null;
  imageUrl?: string | null;
};

const steps = [
  { id: 1, title: "Shopping Cart" },
  { id: 2, title: "Shipping Address" },
  { id: 3, title: "Payment Method" },
];

const CartPage = () => {
  const [shippingForm, setShippingForm] = useState<ShippingFormInputs | null>(null);
  const [cartItems, setCartItems] = useState<PopulatedCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | number | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Rate Limiting Cooldown State
  const [cooldown, setCooldown] = useState<number>(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeStep = parseInt(searchParams.get("step") || "1", 10);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Fetch Cart Items
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await getAllCarts();
      const rawItems: CartType[] = Array.isArray(res) ? res : res?.data || [];

      const populatedItems = await Promise.all(
        rawItems.map(async (item) => {
          let productData = null;
          let variantDetails = null;
          let imageUrl: string | null = null;

          if (item.product_id) {
            try {
              const productRes: any = await getProductById(item.product_id);
              productData = productRes?.product || null;
            } catch (err) {
              console.error(`Failed to load product ID: ${item.product_id}`, err);
            }
          }

          if (item.product_variant_id) {
            try {
              const variantRes: any = await getProductByVarientId(
                Number(item.product_variant_id)
              );
              variantDetails = variantRes?.product_varient || null;

              const imageRes: any = await getVariantImageById(
                Number(item.product_variant_id)
              );
              if (imageRes?.data && Array.isArray(imageRes.data) && imageRes.data.length > 0) {
                imageUrl = imageRes.data[0]?.image_url || null;
              }
            } catch (err) {
              console.error(`Failed to load variant details for ID: ${item.product_variant_id}`, err);
            }
          }

          if (!imageUrl && productData?.images && variantDetails?.colors) {
            imageUrl = productData.images[variantDetails.colors] || null;
          }

          return { ...item, productData, variantDetails, imageUrl };
        })
      );

      setCartItems(populatedItems);
    } catch (error: any) {
      handleApiError(error, { onRateLimit: (sec) => setCooldown(sec) });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update Cart Quantity
  const handleUpdateQuantity = async (
    id: number | string,
    currentQuantity: number,
    change: number
  ) => {
    if (cooldown > 0) return;

    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      setUpdatingItemId(id);
      await updateCartQuantity(id, { quantity: newQuantity });
      await fetchCart();
      toast.success("Quantity updated!");
    } catch (error: any) {
      handleApiError(error, { onRateLimit: (sec) => setCooldown(sec) });
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove Cart Item
  const handleDeleteItem = async (id: number | string) => {
    if (cooldown > 0) return;

    try {
      setUpdatingItemId(id);
      await removeCartItem(id);
      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error: any) {
      handleApiError(error, { onRateLimit: (sec) => setCooldown(sec) });
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Clear Entire Cart
  const handleClearCart = async () => {
    if (cooldown > 0) return;

    try {
      setIsClearing(true);
      await clearCart();
      await fetchCart();
      toast.success("Cart cleared");
    } catch (error: any) {
      handleApiError(error, { onRateLimit: (sec) => setCooldown(sec) });
    } finally {
      setIsClearing(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const priceStr = item.variantDetails?.price || item.productData?.price || "0";
    const priceNum = parseFloat(priceStr);
    return acc + priceNum * item.quantity;
  }, 0);

  const discount = subtotal > 0 ? 50 : 0;
  const shippingFee = cartItems.length > 0 ? 120 : 0;
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-8 max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-medium">Your Shopping Cart</h1>

      {/* STEPS */}
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        {steps.map((step) => (
          <div
            className={`flex items-center gap-2 pb-4 border-b-2 ${
              step.id === activeStep ? "border-gray-800" : "border-gray-200"
            }`}
            key={step.id}
          >
            <div
              className={`w-6 h-6 rounded-full text-white p-4 flex items-center justify-center ${
                step.id === activeStep ? "bg-gray-800" : "bg-gray-400"
              }`}
            >
              {step.id}
            </div>
            <p className={`text-sm ${step.id === activeStep ? "text-gray-800" : "text-gray-400"}`}>
              {step.title}
            </p>
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-7/12 shadow-lg border border-gray-100 p-8 rounded-lg flex flex-col gap-8">
          {activeStep === 1 && (
            <>
              {cartItems.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleClearCart}
                    disabled={isClearing || cooldown > 0}
                    className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isClearing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Clear Cart
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                </div>
              ) : cartItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
              ) : (
                cartItems.map((item) => {
                  const product = item.productData;
                  const variant = item.variantDetails;
                  const itemPrice = parseFloat(variant?.price || product?.price || "0");
                  const rawStock = variant?.stock_quantity ?? product?.quantity;
                  const availableStock = rawStock !== undefined ? Number(rawStock) : Infinity;

                  return (
                    <div
                      className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
                      key={item.id}
                    >
                      <div className="flex gap-6">
                        <div className="relative w-28 h-28 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={product?.product_name || "Product image"}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-between max-w-xs">
                          <div>
                            <p className="text-sm font-medium">
                              {product?.product_name || `Product #${item.product_id}`}
                            </p>

                            <div className="mt-1 space-y-0.5">
                              {variant?.sizes && (
                                <p className="text-xs text-gray-500">
                                  Size: <span className="font-medium text-gray-700">{variant.sizes}</span>
                                </p>
                              )}
                              {variant?.colors && (
                                <p className="text-xs text-gray-500">
                                  Color: <span className="font-medium text-gray-700">{variant.colors}</span>
                                </p>
                              )}
                              {availableStock !== Infinity && (
                                <p className="text-xs text-gray-500">
                                  Available Stock: <span className="font-medium text-gray-700">{availableStock}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* QUANTITY CONTROLS */}
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1 || updatingItemId === item.id || cooldown > 0}
                              className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="text-xs font-semibold">
                              {updatingItemId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              disabled={
                                updatingItemId === item.id ||
                                item.quantity >= availableStock ||
                                cooldown > 0
                              }
                              className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="font-medium mt-2 text-sm">
                            TK {(itemPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={updatingItemId === item.id || cooldown > 0}
                        className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all text-red-400 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {updatingItemId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeStep === 2 && <ShippingForm setShippingForm={setShippingForm} />}

          {activeStep === 3 &&
            (shippingForm ? (
              <PaymentForm />
            ) : (
              <p className="text-red-500">Please fill in the shipping form to continue.</p>
            ))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-5/12 shadow-lg border-2 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
          <h2 className="font-semibold">Cart Details</h2>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Subtotal</p>
              <p className="font-medium">TK.{subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Discount</p>
              <p className="font-medium">TK.{discount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Shipping Fee</p>
              <p className="font-medium">TK.{shippingFee.toFixed(2)}</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between">
            <p className="text-gray-800 font-medium">Total Amount</p>
            <p className="font-semibold">TK.{totalAmount.toFixed(2)}</p>
          </div>

          {activeStep === 1 && (
            <button
              onClick={() => router.push("/cart?step=2", { scroll: false })}
              disabled={cartItems.length === 0 || cooldown > 0}
              className="w-full bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;