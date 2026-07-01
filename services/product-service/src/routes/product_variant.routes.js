import express from "express";

import { createProductVariant, updateProductVariant, deleteProductVariant } from "../controllers/product_variant.controller.js";

const router = express.Router();

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