import express from "express";

import {
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
    getAllProductVariants,
    getProductVariantById,
    getVariantsByProductId,
    getAllProductVariantsWithProductDetails
} from "../controllers/product_variant.controller.js";
import { ROLES } from "../constants.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";

const router = express.Router();

// =======================
// Middlewares (Admin Only)
// =======================
router.use(verifyJWT);
router.use(allowRoles(ROLES.ADMIN));

// =======================
// Base & Static Routes (MUST come before dynamic /:id routes)
// =======================

/**
 * @method POST /api/v1/product-variants
 * @description Create a new product variant
 * @access Private (Admin)
 */
router.post("/", createProductVariant);

/**
 * @method GET /api/v1/product-variants
 * @description Get all product variants
 * @access Private (Admin)
 */
router.get("/", getAllProductVariants);

/**
 * @method GET /api/v1/product-variants/details
 * @description Get all variants joined with parent product details
 * @access Private (Admin)
 */
router.get("/details", getAllProductVariantsWithProductDetails);

/**
 * @method GET /api/v1/product-variants/product/:productId
 * @description Get all variants belonging to a specific product
 * @access Private (Admin)
 */
router.get("/product/:productId", getVariantsByProductId);

// =======================
// Dynamic Parameter Routes (/:id)
// =======================

/**
 * @method GET /api/v1/product-variants/:id
 * @description Get a single variant by its ID
 * @access Private (Admin)
 */
router.get("/:id", getProductVariantById);

/**
 * @method PATCH /api/v1/product-variants/:id
 * @description Update a product variant
 * @access Private (Admin)
 */
router.patch("/:id", updateProductVariant);

/**
 * @method DELETE /api/v1/product-variants/:id
 * @description Delete a product variant
 * @access Private (Admin)
 */
router.delete("/:id", deleteProductVariant);

export default router;