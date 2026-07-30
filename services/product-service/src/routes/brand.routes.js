import express from "express";

import {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand
} from "../controllers/brand.controller.js";

import { verifyJWT } from '../middlewares/auth.middleware.js';
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
 * @method GET /api/v1/brands
 * @description Get all brands
 * @access Private (User, Admin)
 */
router.get("/", getAllBrands);

/**
 * @method GET /api/v1/brands/:id
 * @description Get a brand by its ID
 * @access Private (User, Admin)
 */
router.get("/:id", getBrandById);

// =======================
// Admin Routes
// =======================

/**
 * @middleware allowRoles(ROLES.ADMIN)
 * @description All routes below are accessible only by administrators.
 */
router.use(allowRoles(ROLES.ADMIN));

/**
 * @method POST /api/v1/brands
 * @description Create a new brand
 * @access Private (Admin)
 */
router.post("/", createBrand);

/**
 * @method PATCH /api/v1/brands/:id
 * @description Dynamically update an existing brand
 * @access Private (Admin)
 */
router.patch("/:id", updateBrand);


/**
 * @method DELETE /api/v1/brands/:id
 * @description Delete a brand by ID
 * @access Private (Admin)
 */
router.delete("/:id", deleteBrand);

export default router;