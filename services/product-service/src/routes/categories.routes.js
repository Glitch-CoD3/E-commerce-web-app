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

import { verifyJWT } from '../middlewares/auth.middleware.js'
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
router.use(verifyJWT);

/**
 * @method GET /api/v1/categories
 * @description Get all categories
 * @access Private (User, Admin)
 */
router.get("/", getAllCategories);

/**
 * @method GET /api/v1/categories/parents
 * @description Get all parent categories
 * @access Private (User, Admin)
 */
router.get("/parents", getParentCategories);

/**
 * @method GET /api/v1/categories/deleted
 * @description Get all soft-deleted categories
 * @access Private (Admin)
 */
router.get(
    "/deleted",
    allowRoles(ROLES.ADMIN),
    getAllDeletedCategories
);

/**
 * @method GET /api/v1/categories/slug/:slug
 * @description Get a category by its slug
 * @access Private (User, Admin)
 */
router.get("/slug/:slug", getCategoryBySlug);

/**
 * @method GET /api/v1/categories/:parentId/children
 * @description Get all child categories under a parent category
 * @access Private (User, Admin)
 */
router.get("/:parentId/children", getChildCategories);

/**
 * @method GET /api/v1/categories/:id
 * @description Get a category by its ID
 * @access Private (User, Admin)
 */
router.get("/:id", getCategoryById);

// =======================
// Admin Routes
// =======================

/**
 * @middleware allowRoles(ROLES.ADMIN)
 * @description All routes below are accessible only by administrators.
 */
router.use(allowRoles(ROLES.ADMIN));

/**
 * @method POST /api/v1/categories
 * @description Create a new category
 * @access Private (Admin)
 */
router.post("/", createCategory);

/**
 * @method PUT /api/v1/categories/:id
 * @description Update an existing category
 * @access Private (Admin)
 */
router.put("/:id", updateCategory);

/**
 * @method DELETE /api/v1/categories/:id
 * @description Soft delete a category
 * @access Private (Admin)
 */
router.delete("/:id", deleteCategory);

export default router;