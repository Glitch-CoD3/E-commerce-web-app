import express from "express";

import { createProductVariant, updateProductVariant, deleteProductVariant } from "../controllers/product_variant.controller.js";
import { ROLES } from "../constants.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";

const router = express.Router();
// =======================
// Admin Routes
// =======================

router.use(verifyJWT);
router.use(allowRoles(ROLES.ADMIN));

/**
 * @method POST /api/v1/product-variants
 * @description Create a new product variant
 * @access Private (Admin)
 */
router.post("/", createProductVariant);

/**
 * @method PUT /api/v1/product-variants/:id
 * @description Update a product variant
 * @access Private (Admin)
 */
router.put("/:id", updateProductVariant);

/**
 * @method DELETE /api/v1/product-variants/:id
 * @description Update a product variant
 * @access Private (Admin)
 */
router.delete("/:id", deleteProductVariant);

export default router;