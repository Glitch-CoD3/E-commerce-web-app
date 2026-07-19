import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constants.js";

import {
    createOrder,
    buyNowDirectly,
    getOrdersByUserId,
    getOrderByOrderId,
    order_cancel,
    updateOrderStatus,
    getAllOrders,
    orderDashboardStatistics,
    getOrderDetailsByOrderId,
    updatePaymentStatus
} from "../controllers/order.controller.js";

const router = express.Router();

// =====================================================
// Authenticated User Routes
// =====================================================

/**
 * @middleware verifyJWT
 * @description All routes in this section require an authenticated user.
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

// =====================================================
// Admin Routes
// =====================================================

/**
 * @method GET /api/v1/orders/admin
 * @description Get all orders.
 * @access Private (Admin)
 */
router.get(
    "/admin",
    allowRoles(ROLES.ADMIN),
    getAllOrders
);

/**
 * @method GET /api/v1/orders/admin/dashboard
 * @description Get order dashboard statistics.
 * @access Private (Admin)
 */
router.get(
    "/admin/dashboard",
    allowRoles(ROLES.ADMIN),
    orderDashboardStatistics
);

/**
 * @method GET /api/v1/orders/admin/:orderId
 * @description Get detailed information about any order.
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
 * @method PATCH /api/v1/orders/:orderId/status
 * @description Update the order status (Processing, Shipped, Delivered, etc.).
 * @access Private (Admin)
 */
router.patch(
    "/:orderId/status",
    allowRoles(ROLES.ADMIN),
    updateOrderStatus
);

// =====================================================
// User Routes (Dynamic)
// =====================================================

/**
 * @method GET /api/v1/orders/:orderId
 * @description Get details of a specific order belonging to the authenticated user.
 * @access Private (User)
 */
router.get("/:orderId", getOrderByOrderId);

export default router;