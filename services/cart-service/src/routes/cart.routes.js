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


const router = express.Router();

/**
 * @route POST /api/v1/cart
 * @description Add a product to the authenticated user's cart.
 * @access Private (Authenticated User)
 */
router.post("/", verifyJWT, addToCart);

/**
 * @route GET /api/v1/cart
 * @description Retrieve all items in the authenticated user's cart.
 * @access Private (Authenticated User)
 */
router.get("/", verifyJWT, getCart);

/**
 * @route GET /api/v1/cart/:id
 * @description Retrieve a specific cart item by its ID.
 * @access Private (Authenticated User)
 */
router.get("/:id", verifyJWT, getCartItemById);

/**
 * @route PATCH /api/v1/cart/:id
 * @description Update the quantity of a specific cart item.
 * @access Private (Authenticated User)
 */
router.patch("/:id", verifyJWT, updateCartQuantity);

/**
 * @route DELETE /api/v1/cart/:id
 * @description Remove a specific item from the authenticated user's cart.
 * @access Private (Authenticated User)
 */
router.delete("/:id",verifyJWT, removeCartItem);

/**
 * @route DELETE /api/v1/cart
 * @description Remove all items from the authenticated user's cart.
 * @access Private (Authenticated User)
 */
router.delete("/",verifyJWT, clearCart);

export default router;