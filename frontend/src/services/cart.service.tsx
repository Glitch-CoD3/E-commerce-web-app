import AxiosInstance from "../api/axiosInstance";

// ==========================================
// CART TYPES
// ==========================================

export type CartType = {
  id: number | string;
  user_id: number | string;
  product_variant_id?: number | string | null;
  product_id?: number | string | null;
  quantity: number;
  created_at?: string;
  updated_at?: string;
};

export type AddToCartInput = {
  product_id?: number | string;
  product_variant_id?: number | string;
  quantity: number;
};


// ==========================================
// CART SERVICE API CALLS
// ==========================================

// 1. Add To Cart
export const addToCart = async (
  data: AddToCartInput
): Promise<CartType> => {
  const response = await AxiosInstance.post("/cart", data);
  return response.data;
};

// 2. Get All Carts
export const getAllCarts = async (): Promise<CartType[]> => {
  const response = await AxiosInstance.get("/cart");
  return response.data;
};

// 3. Get Cart Item By ID
export const getCartItemById = async (
  id: number | string
): Promise<CartType> => {
  const response = await AxiosInstance.get(`/cart/${id}`);
  return response.data;
};

// 4. Update Cart Quantity
export const updateCartQuantity = async (
  id: number | string,
  data: { quantity: number }
): Promise<CartType> => {
  const response = await AxiosInstance.patch(
    `/cart`,
    data
  );
  return response.data;
};

// 5. Remove Cart Item
export const removeCartItem = async (
  id: number | string
): Promise<void> => {
  const response = await AxiosInstance.delete(`/cart/${id}`);
  return response.data;
};

// 6. Clear Cart
export const clearCart = async (): Promise<void> => {
  const response = await AxiosInstance.delete("/cart");
  return response.data;
};