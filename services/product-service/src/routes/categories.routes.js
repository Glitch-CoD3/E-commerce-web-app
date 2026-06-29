import express from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryBySlug,
    getParentCategories,
    getChildCategories,
    getAllDeletedCategories
} from "../controllers/categories.controller.js";

const router = express.Router();

// Create Category
router.post("/", createCategory);

// Get Parent Categories
router.get("/parents", getParentCategories);

// Get Category by Slug
router.get("/slug/:slug", getCategoryBySlug);

// Get Child Categories under Parent
router.get("/:parentId/children", getChildCategories);

// Get All Categories
router.get("/", getAllCategories);

// Get All  Deleted Categories
router.get("/deleted", getAllDeletedCategories);

// Get Category by ID
router.get("/:id", getCategoryById);

// Update Category
router.put("/:id", updateCategory);

// Delete Category
router.delete("/:id", deleteCategory);

export default router;