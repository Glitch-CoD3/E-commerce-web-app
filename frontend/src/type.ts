import { z } from "zod";
import {  type ReactNode } from 'react';

export type ProductType = {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  price: number; // 
  category_id: number;
  url_slug: string;
  category_name: string;
  category_slug: string;
  brand_id: number;
  brand_name: string;
  brand_logo: string;
  sizes: string[];
  colors: string[];
  images: Record<string, string>; // <--- Record/Object for color keys -> image URL mapping
};

export type ProductsType = ProductType[];

export type CartItemType = ProductType & {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type CartItemsType = CartItemType[];

export const shippingFormSchema = z.object({
  name: z.string().min(1, "Name is required!"),
  email: z.email().min(1, "Email is required!"),
  phone: z
    .string()
    .min(11, "Phone number must be between 11 and 14 digits!")
    .max(14, "Phone number must be between 11 and 14 digits with +880 !")
    .regex(/^\d+$/, "Phone number must contain only numbers!"),
  address: z.string().min(1, "Address is required!"),
  city: z.string().min(1, "City is required!"),
  state: z.string().min(1, "State is required!"),
});

export type ShippingFormInputs = z.infer<typeof shippingFormSchema>;

export const paymentFormSchema = z.object({
  cardHolder: z.string().min(1, "Card holder is required!"),
  cardNumber: z
    .string()
    .min(16, "Card Number is required!")
    .max(16, "Card Number is required!"),
  expirationDate: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/\d{2}$/,
      "Expiration date must be in MM/YY format!"
    ),
  cvv: z.string().min(3, "CVV is required!").max(3, "CVV is required!"),
});

export type PaymentFormInputs = z.infer<typeof paymentFormSchema>;

export type CartStoreStateType = {
  cart: CartItemsType;
  hasHydrated: boolean;
};

export type CartStoreActionsType = {
  addToCart: (product: CartItemType) => void;
  removeFromCart: (product: CartItemType) => void;
  clearCart: () => void;
};


// .........................order Type.........................
export type OrderStatus = 'paid' | 'pending' | 'unpaid' | 'cancelled' | 'shipped';

export type OrderItem = {
  productId: string;
  productName: string;
  variantDetails: string;
  quantity: number;
  price: number;
};

export type RawOrder = {
  id: string;
  user_id: string;
  customerName?: string;
  customerEmail?: string;
  address?: string;
  created_at: string;
  status: OrderStatus;
  items: OrderItem[];
  net_amount: number;
};

export type Order = {
  id: string;
  user_id: string;
  customerName: string;
  customerEmail: string;
  address: string;
  created_at: string;
  status: OrderStatus;
  items: OrderItem[];
  net_amount: number;
};

export type OrderTabProps = {
  onSelectOrder: (order: Order) => void;
  getStatusBadge: (status: OrderStatus) => ReactNode;
  tableHeaderBg: string;
  borderRow: string;
};


// Top selling Product tab in ADMIN dashboard
export type ProductVariantRanked = {
  // Rank & Status
  rank: number;
  productStatus?: string;
  
  // Product Info
  productId: string;
  productName: string;
  categoryName?: string;
  currentStock?: number;
  
  // Variant Info
  variantId?: number | string;
  variantLabel?: string;
  variantColor?: string;
  variantSize?: string;
  variantStock?: number;
  
  // Sales & Revenue Metrics
  totalUnitsSold: string | number;
  totalOrders: number;
  totalRevenueGenerated: string;
  avgSellingPrice: string;
  basePrice: string;
  avgUnitsPerOrder?: string;
  revenueSharePercent: string;
  
  // Optional raw nested variants array if passing raw products
  variants?: Array<{
    id?: string | number;
    color?: string;
    size?: string;
    price?: number;
    stock?: number;
  }>;
};

export type TopSellingTabProps = {
  products?: ProductVariantRanked[];
  tableHeaderBg: string;
  borderRow: string;
};