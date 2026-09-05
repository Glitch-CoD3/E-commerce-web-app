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

export type CreateCategoryInput = {
  category_name: string;
  url_slug: string;
  parent_category_id?: number | null;
  status?: number | string;
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


// 4. Update Category
export const updateCategory = async (
  id: number | string,
  data: Partial<CreateCategoryInput>
): Promise<CategoryType> => {
  const response = await AxiosInstance.put(`/categories/${id}`, data);
  return response.data;
};

// 5. Delete Category
export const deleteCategory = async (id: number | string): Promise<void> => {
  const response = await AxiosInstance.delete(`/categories/${id}`);
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
  name: string;
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
export const getAllProducts = async (page: number = 1, perPage: number = 10) => {
  const response = await AxiosInstance.get("/products", {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};


//Get Top Selling Products API call
export const getTopSellingProducts = async (page: number = 1, perPage: number = 10) => {
  const response = await AxiosInstance.get("/products/top-selling");
  return response.data;
};


//get product by varient id
export const getProductByVarientId = async (id: number) => {
  const response = await AxiosInstance.get(`/product-variants/${id}`);
  return response.data;
};

export const getVariantImageById = async (id: number) => {
  const response = await AxiosInstance.get(`/product-variants-image/${id}`);
  return response.data;
};

//-------------------------------//
//PRODUCTS Brands API CALLS
//-------------------------------//

export type CreateBrandInput = {
  brand_name: string;
  logo?: string | null;
  created_at?: Date | string;
  id?: number | bigint; // Optional since DB usually auto-increments this
};

export type Brand = {
  id: string | number;
  brand_name: string;
  logo: string | null;
  created_at: Date | string;
};


// Get all Brands API call
export const getAllBrands = async (page: number = 1, perPage: number = 10) => {
  const response = await AxiosInstance.get("/brands", {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

// 2. Create Brand
export const createBrand = async (data: CreateBrandInput): Promise<Brand> => {
  const response = await AxiosInstance.post("/brands", data);
  return response.data;
};

// 3. Update Brand
export const updateBrand = async (
  id: string | number,
  data: Partial<CreateBrandInput>
): Promise<Brand> => {
  const response = await AxiosInstance.put(`/brands/${id}`, data);
  return response.data;
};

// 4. Delete Brand
export const deleteBrand = async (id: string | number): Promise<void> => {
  const response = await AxiosInstance.delete(`/brands/${id}`);
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

export type VariantDraft = {
  color: string;
  size: ProductSize | '';
  price: string;
  stock_quantity: string;
};

export type ProductTabProps = {
  formSubBg?: string;
  tableHeaderBg?: string;
  inputBg?: string;
  borderRow?: string;
};

export type ProductTableProps = {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    pageSize: number;
  };
  isFetchingData: boolean;
  tableHeaderBg: string;
  borderRow: string;
  inputBg: string;

  expandedProductId: number | null;
  variantsByProduct: Record<number, ProductVariant[]>;
  loadingVariantsFor: number | null;
  onToggleVariants: (productId: number) => void;

  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: number) => void;

  editingVariantId: number | null;
  variantDraft: VariantDraft;
  setVariantDraft: React.Dispatch<React.SetStateAction<VariantDraft>>;
  savingVariantId: number | null;
  onStartEditVariant: (v: ProductVariant) => void;
  onCancelEditVariant: () => void;
  onSaveVariantEdit: (productId: number, variantId: number) => void;
  onDeleteVariant: (productId: number, variantId: number) => void;

  addingVariantFor: number | null;
  newVariantDraft: VariantDraft;
  setNewVariantDraft: React.Dispatch<React.SetStateAction<VariantDraft>>;
  creatingVariant: boolean;
  onStartAddVariant: (productId: number) => void;
  onCancelAddVariant: () => void;
  onCreateVariant: (productId: number) => void;

  busyImageKey: string | null;
  onAddImage: (productId: number, variantId: number, file: File) => void;
  onReplaceImage: (productId: number, variantId: number, imageId: number, file: File) => void;
  onDeleteImage: (productId: number, variantId: number, imageId: number) => void;
};


export type PaginationMeta = {
  current_page: number;
  total_pages: number;
  total_products: number;
  per_page: number;
  search?: string;
}

export type PaginatedProductTableProps = Omit<ProductTableProps, 'pagination'> & {
  pagination?: PaginationMeta;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCategoryChange?: (category: string) => void;
}



//-------------ProductForm.tsx Admin Dashboard------------------//
export type ProductFormState = {
  product_name: string;
  category_id: number;
  brand_id: number | undefined;
  short_description: string;
  description: string;
  status: ProductStatus;
  price: string;
  stock_quantity: string;
};

export type ProductFormProps = {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: CategoryType[];
  brands: Brand[];
  editingId: number | null;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  formSubBg: string;
  inputBg: string;
};