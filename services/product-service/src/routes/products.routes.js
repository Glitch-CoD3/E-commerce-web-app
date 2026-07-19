import express from "express";

import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    getProductsByCategoryId,
    getAllDeletedProducts
} from "../controllers/products.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";


const router = express.Router();

// =======================
// Authenticated User Routes
// =======================

/**
 * @middleware verifyJWT
 * @description All routes below require an authenticated user.
 */
router.use(verifyJWT)

/**
 * @method GET /api/v1/products
 * @description Get all products
 * @access Public
 */
router.get("/", getAllProducts);

/**
 * @method GET /api/v1/products/category/:categoryId
 * @description Get all products by category ID
 * @access Public
 */
router.get("/category/:categoryId", getProductsByCategoryId);

/**
 * @method GET /api/v1/products/slug/:slug
 * @description Get a product by its slug
 * @access Public
 */
router.get("/slug/:slug", getProductBySlug);



/**
 * @method GET /api/v1/products/deleted
 * @description Get all soft-deleted products
 * @access Private (Admin)
 */
router.get(
    "/deleted",
    allowRoles(ROLES.ADMIN),
    getAllDeletedProducts
);

/**
 * @method GET /api/v1/products/:id
 * @description Get a product by its ID
 * @access Public
 */
router.get("/:id", getProductById);


// =======================
// Admin Routes
// =======================

/**
 * @middleware allowRoles(ROLES.ADMIN)
 * @description All routes below are accessible only by administrators.
 */
router.use(allowRoles(ROLES.ADMIN));

/**
 * @method POST /api/v1/products
 * @description Create a new product
 * @access Private (Admin)
 */
router.post("/", createProduct);

/**
 * @method PUT /api/v1/products/:id
 * @description Update an existing product
 * @access Private (Admin)
 */
router.put("/:id", updateProduct);

/**
 * @method PATCH /api/v1/products/:id/status
 * @description Update product status
 * @access Private (Admin)
 */
router.patch("/:id/status", updateProductStatus);

/**
 * @method DELETE /api/v1/products/:id
 * @description Soft delete a product
 * @access Private (Admin)
 */
router.delete("/:id", deleteProduct);

export default router;