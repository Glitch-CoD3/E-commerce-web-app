import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constants.js";

import {
    // Existing Controllers
    createOrder,
    buyNowDirectly,
    getOrdersByUserId,
    getOrderByOrderId,
    order_cancel,
    updateOrderStatus,
    getAllOrders,
    orderDashboardStatistics,
    getOrderDetailsByOrderId,
    updatePaymentStatus,

    // // New Return & Refund Controllers
    // createReturnRequest,
    // processRefund,

    // New Analytics Controllers
    getTopSellingProducts,
    getSalesTrendOverTime,
    getInventoryAlerts,
    getCustomerAnalytics
} from "../controllers/order.controller.js";

const router = express.Router();

// =====================================================
// Authenticated User Routes (Global JWT Middleware)
// =====================================================

/**
 * @middleware verifyJWT
 * @description All routes defined below require an authenticated user.
 */
router.use(verifyJWT);

/**
 * @method POST /api/v1/orders
 * @description Create a new order from the authenticated user's cart.
 * @access Private (User)
 */
router.post("/", createOrder);

/**
 * @method POST /api/v1/orders/buy-now
 * @description Create a direct "Buy Now" order.
 * @access Private (User)
 */
router.post("/buy-now", buyNowDirectly);

/**
 * @method GET /api/v1/orders
 * @description Get all orders of the authenticated user.
 * @access Private (User)
 */
router.get("/", getOrdersByUserId);

/**
 * @method PATCH /api/v1/orders/:orderId/cancel
 * @description Cancel an order placed by the authenticated user.
 * @access Private (User)
 */
router.patch("/:orderId/cancel", order_cancel);

/**
 * @method POST /api/v1/orders/returns/request
 * @description Request a return for a delivered order.
 * @access Private (User)
 */
// router.post("/returns/request", createReturnRequest);

// =====================================================
// Admin Routes (Order & Fulfillment Management)
// =====================================================

/**
 * @method GET /api/v1/orders/admin
 * @description Get all orders in the platform.
 * @access Private (Admin)
 */
router.get(
    "/admin",
    allowRoles(ROLES.ADMIN),
    getAllOrders
);

/**
 * @method GET /api/v1/orders/admin/:orderId
 * @description Get detailed information about any specific order.
 * @access Private (Admin)
 */
router.get(
    "/admin/:orderId",
    allowRoles(ROLES.ADMIN),
    getOrderDetailsByOrderId
);

/**
 * @method PATCH /api/v1/orders/admin/:orderId/update_payment_status
 * @description Update the payment status of an order.
 * @access Private (Admin)
 */
router.patch(
    "/admin/:orderId/update_payment_status",
    allowRoles(ROLES.ADMIN),
    updatePaymentStatus
);

/**
 * @method PATCH /api/v1/orders/admin/:orderId/status
 * @description Update the fulfillment status of an order (Processing, Shipped, Delivered, etc.).
 * @access Private (Admin)
 */
router.patch(
    "/admin/:orderId/status",
    allowRoles(ROLES.ADMIN),
    updateOrderStatus
);

/**
 * @method POST /api/v1/orders/admin/refund
 * @description Process a return refund and restock product inventory.
 * @access Private (Admin)
 */
// router.post(
//     "/admin/refund",
//     allowRoles(ROLES.ADMIN),
//     processRefund
// );

// =====================================================
// Admin Analytics Routes
// =====================================================

/**
 * @method GET /api/v1/orders/admin/dashboard
 * @description Get high-level KPI dashboard statistics.
 * @access Private (Admin)
 */
router.get(
    "/admin/dashboard",
    allowRoles(ROLES.ADMIN),
    orderDashboardStatistics
);

/**
 * @method GET /api/v1/orders/admin/analytics/sales-trend
 * @description Get sales and revenue trends over time (monthly/daily).
 * @access Private (Admin)
 */
router.get(
    "/admin/analytics/sales-trend",
    allowRoles(ROLES.ADMIN),
    getSalesTrendOverTime
);

/**
 * @method GET /api/v1/orders/admin/analytics/top-selling-products
 * @description Get top selling products by volume and revenue.
 * @access Private (Admin)
 */
router.get(
    "/admin/analytics/top-selling-products",
    allowRoles(ROLES.ADMIN),
    getTopSellingProducts
);

/**
 * @method GET /api/v1/orders/admin/analytics/inventory-alerts
 * @description Get low stock and out-of-stock product warnings.
 * @access Private (Admin)
 */
router.get(
    "/admin/analytics/inventory-alerts",
    allowRoles(ROLES.ADMIN),
    getInventoryAlerts
);

/**
 * @method GET /api/v1/orders/admin/analytics/customer-metrics
 * @description Get customer lifetime value and repeat purchase analytics.
 * @access Private (Admin)
 */
router.get(
    "/admin/analytics/customer-metrics",
    allowRoles(ROLES.ADMIN),
    getCustomerAnalytics
);

// =====================================================
// Dynamic User Routes (MUST BE AT THE BOTTOM)
// =====================================================

/**
 * @method GET /api/v1/orders/:orderId
 * @description Get details of a specific order belonging to the authenticated user.
 * @access Private (User)
 */
router.get("/:orderId", getOrderByOrderId);

export default router;