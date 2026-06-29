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

const router = express.Router();

// Create Product
router.post("/", createProduct);

// Get all Products
router.get("/", getAllProducts);

// Get All Deleted Products
router.get("/deleted", getAllDeletedProducts);

// Get Product by product_id
router.get("/:id", getProductById);

// Get Product by slug_url
router.get("/slug/:slug", getProductBySlug);

// Get Product by category_id
router.get("/category/:categoryId", getProductsByCategoryId);

// Update Product
router.put("/:id", updateProduct);

// Update Product status
router.patch("/:id/status", updateProductStatus);

// Delete Product
router.delete("/:id", deleteProduct);

export default router;