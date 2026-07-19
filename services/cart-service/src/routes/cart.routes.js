import express from "express";
import {
    addToCart,
    getCart,
    getCartItemById,
    updateCartQuantity,
    removeCartItem,
    clearCart
} from "../controllers/cart.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

// =====================================================
// Authenticated User Routes
// =====================================================

/**
 * @middleware verifyJWT
 * @description All routes below require an authenticated user.
 */
router.use(verifyJWT);

/**
 * @middleware allowRoles(ROLES.USER, ROLES.ADMIN)
 * @description All routes below are accessible by authenticated users and administrators.
 */
router.use(allowRoles(ROLES.USER, ROLES.ADMIN));

/**
 * @method POST /api/v1/cart
 * @description Add a product to the authenticated user's cart.
 * @access Private (User, Admin)
 */
router.post("/", addToCart);

/**
 * @method GET /api/v1/cart
 * @description Retrieve all items in the authenticated user's cart.
 * @access Private (User, Admin)
 */
router.get("/", getCart);

/**
 * @method GET /api/v1/cart/:id
 * @description Retrieve a specific cart item by its ID.
 * @access Private (User, Admin)
 */
router.get("/:id", getCartItemById);

/**
 * @method PATCH /api/v1/cart/:id
 * @description Update the quantity of a specific cart item.
 * @access Private (User, Admin)
 */
router.patch("/:id", updateCartQuantity);

/**
 * @method DELETE /api/v1/cart/:id
 * @description Remove a specific item from the authenticated user's cart.
 * @access Private (User, Admin)
 */
router.delete("/:id", removeCartItem);

/**
 * @method DELETE /api/v1/cart
 * @description Remove all items from the authenticated user's cart.
 * @access Private (User, Admin)
 */
router.delete("/", clearCart);

export default router;