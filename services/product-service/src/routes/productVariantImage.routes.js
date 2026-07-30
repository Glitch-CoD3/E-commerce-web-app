import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    uploadVariantImage,
    getVariantImages,
    deleteVariantImage
} from "../controllers/productVariantImage.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";
import { allowRoles } from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.use(verifyJWT);
// Upload one image
router.post(
    "/:variantId", allowRoles(ROLES.ADMIN),
    upload.single("image"),
    uploadVariantImage
);

// Get all images of a variant
router.get("/:variantId", getVariantImages);

// Delete one image
router.delete("/:imageId", allowRoles(ROLES.ADMIN), deleteVariantImage);

export default router;