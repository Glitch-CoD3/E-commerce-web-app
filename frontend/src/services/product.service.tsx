import AxiosInstance from '../api/axiosInstance';

export type CategoryType = {
  id: number | string;
  category_name: string;
  url_slug: string;
  parent_category_id?: number | null;
  status?: number | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};




// Create category API call
export const createCategory = async (data: Partial<CategoryType>) => {
  const response = await AxiosInstance.post("/categories", data);
  return response.data;
};

// Get all Categories API call
export const getCategories = async () => {
  const response = await AxiosInstance.get("/categories");
  return response.data;
};

// Get category by category ID API call
export const getCategoryById = async (id: number | string) => {
  const response = await AxiosInstance.get(`/categories/${id}`);
  return response.data;
};


//-------------------------------//
//PRODUCTS API CALLS
//-------------------------------//

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

// Full Product model from database
export type Product = {
  id: number;
  category_id: number;
  brand_id?: number | null;
  product_name: string;
  url_slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

// Input type for CREATING a new product
export type CreateProductInput = {
  category_id: number;
  brand_id?: number | null;
  product_name: string;
  url_slug: string;
  description?: string;
  short_description?: string;
  price: number;
  stock_quantity?: number;
  status: ProductStatus;
};

//Create product API call
export const createProduct = async (data: any) => {
  const response = await AxiosInstance.post("/products", data);
  return response.data;
};

// Get all Products API call
export const getAllProducts = async () => {
  const response = await AxiosInstance.get("/products");
  return response.data;
};


//Get Top Selling Products API call
export const getTopSellingProducts = async () => {
  const response = await AxiosInstance.get("/products/top-selling");
  return response.data;
};


// Get all Brands API call
export const getAllBrands = async () => {
  const response = await AxiosInstance.get("/brands");
  return response.data;
};




//-------------------------------//
//PRODUCTS VARIANTS API CALLS
//-------------------------------//
export type ProductSize = 'M' | 'L' | 'XL' | 'XXL' | '3XL';

// Product Variant Images ---
export type ProductVariantImage = {
  id: number;
  product_variant_id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

//  Product Variants ---
export type ProductVariant = {
  id: number;
  product_id: number;
  colors?: string | null;
  sizes?: ProductSize | null;
  price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  images?: ProductVariantImage[]; // Nested relation
};



// --- INPUT TYPES FOR CREATING PRODUCT WITH VARIANTS ---
export type CreateVariantImageInput = {
  image_url: string;
  sort_order?: number;
};

export type CreateVariantInput = {
  colors?: string;
  sizes?: ProductSize;
  price: number;
  stock_quantity?: number;
  images?: CreateVariantImageInput[];
};




