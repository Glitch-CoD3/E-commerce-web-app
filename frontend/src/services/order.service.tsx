import AxiosInstance from '../api/axiosInstance';
export type OrderType = {
  id: number | string;
  category_id: number | string;
  brand_id?: number | string | null;
  product_name: string;
  url_slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number | string;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type OrderInputType = {
  category_id: number | string;
  brand_id?: number | string | null;
  product_name: string;
  url_slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number | string;
  stock_quantity: number;
  status?: 'active' | 'inactive' | 'discontinued';
};


// ==========================================
// ALL ORDER & ANALYTICS API CALLS
// ==========================================

// 1. Create Order
export const createOrder = async (data: any) => {
  const response = await AxiosInstance.post("/order", data);
  return response.data;
};


// 3. Get User Orders History
export const getUserOrdersHistory = async () => {
  const response = await AxiosInstance.get("/order");
  return response.data;
};

// 4. Get Order By Order ID
export const getOrderByOrderId = async (id: number | string) => {
  const response = await AxiosInstance.get(`/order/${id}`);
  return response.data;
};

// 5. Direct Order By Product ID
export const directOrderByProductId = async (data: any) => {
  const response = await AxiosInstance.post("/order/buy-now", data);
  return response.data;
};

// 6. Cancel Order
export const cancelOrder = async (id: number | string, data?: any) => {
  const response = await AxiosInstance.patch(`/order/${id}/cancel`, data);
  return response.data;
};

// 7. Update Order Status
export const updateOrderStatus = async (
  id: number | string,
  status: string
) => {
  const response = await AxiosInstance.patch(`/order/admin/${id}/status`, {
    status: status.toLowerCase(),
  });
  return response.data;
};

// 9. Get All Orders (Admin)
export const getAdminDashboard = async (params?: { year?: number; month?: number }) => {
  const response = await AxiosInstance.get("/order/admin/dashboard", { params });
  return response.data;
};

// 8. Admin Dashboard Data
export const getAllOrdersAdmin = async (page: number = 1) => {
  const response = await AxiosInstance.get(`/order/admin?page=${page}`);
  return response.data;
};

// 10. Get Order By Order ID (Admin)
export const getOrderByOrderIdAdmin = async (id: number | string) => {
  const response = await AxiosInstance.get(`/order/admin/${id}`);
  return response.data;
};

// 11. Update Payment Status (Admin)
export const updatePaymentStatus = async (id: string | number, paymentStatus: string) => {
  return AxiosInstance.patch(`/order/admin/${id}/update_payment_status`, {
    payment_status: paymentStatus.toLowerCase(),
  });
};

// 12. Get Sales Trend Over Time
export const getSalesTrendOverTime = async (params?: {
  startDate?: string;
  endDate?: string;
  period?: "daily" | "monthly" | "yearly";
}) => {
  const response = await AxiosInstance.get("/order/admin/analytics/sales-trend", {
    params,
  });
  return response.data;
};

// 13. Get Top Selling Products
export const getTopSellingProducts = async (params?: { limit?: number }) => {
  const response = await AxiosInstance.get("/order/admin/analytics/top-selling-products", {
    params,
  });
  return response.data;
};

// 14. Get Inventory Alerts
export const getInventoryAlerts = async () => {
  const response = await AxiosInstance.get("/order/admin/analytics/inventory-alerts");
  return response.data;
};

// 15. Get Customer Analytics
export const getCustomerAnalytics = async () => {
  const response = await AxiosInstance.get("/order/admin/analytics/customer-metrics");
  return response.data;
};


// 16. Get all paid Customer 
export const getAllPaidCustomers = async () => {
  const response = await AxiosInstance.get("/order/admin/analytics/customer-metrics/paid-customers");
  return response.data;
};

// ==========================================
// SHIPPING ADDRESS API CALLS
// ==========================================

// 1. Create Shipping Address
export const createShippingAddress = async (data: any) => {
  const response = await AxiosInstance.post("/order/address", data);
  return response.data;
};

// 2. Update Shipping Address
export const updateShippingAddress = async (id: number | string, data: any) => {
  const response = await AxiosInstance.put(`/order/address/${id}`, data);
  return response.data;
};

// 3. Get Shipping Address By ID
export const getShippingAddressById = async (id: number | string) => {
  const response = await AxiosInstance.get(`/order/address/${id}`);
  return response.data;
};

// 4. Get User Shipping Address
export const getUserShippingAddress = async (id: number) => {
  const response = await AxiosInstance.get(`/order/address/user/${id}`);
  return response.data;
};