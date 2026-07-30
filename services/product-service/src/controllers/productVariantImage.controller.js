import DB from '../config/db.config.js'
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import { deleteImageFromCloudinary } from "../utils/cloudinary.js";

const uploadVariantImage = async (req, res) => {
    try {

        const { variantId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }

        // Check for avatar
        const imageLocalPath = req.file.path;
        if (!imageLocalPath) {

            return res.status(401).json({
                success: false,
                message: "Image are required"
            })
        }



        // Upload images
        const result = await uploadImageToCloudinary(imageLocalPath);

        if (!result) {
            return res.status(500).json({
                success: false,
                message: "Cloudinary upload failed"
            });
        }

        // Get next sort_order
        const [rows] = await DB.promise().query(
            `SELECT IFNULL(MAX(sort_order),0)+1 AS sort_order
             FROM variant_images
             WHERE product_variant_id=?`,
            [variantId]
        );

        const sortOrder = rows[0].sort_order;

        // Save image
        await DB.promise().query(
            `INSERT INTO variant_images
            (
                product_variant_id,
                image_url,
                sort_order
            )
            VALUES
            (
                ?,?,?
            )`,
            [
                variantId,
                result.secure_url,
                sortOrder
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully.",
            data: {
                image_url: result.secure_url,
                sort_order: sortOrder
            }
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getVariantImages = async (req, res) => {
    try {

        const { variantId } = req.params;

        const [images] = await DB.promise().query(
            `SELECT
                id,
                product_variant_id,
                image_url,
                sort_order,
                created_at
            FROM variant_images
            WHERE product_variant_id = ?
            AND deleted_at IS NULL
            ORDER BY sort_order ASC`,
            [variantId]
        );

        return res.status(200).json({
            success: true,
            count: images.length,
            data: images
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const deleteVariantImage = async (req, res) => {
    try {

        const { imageId } = req.params;

        // Find image
        const [rows] = await DB.promise().query(
            `SELECT
                image_url
            FROM variant_images
            WHERE id = ?
            AND deleted_at IS NULL`,
            [imageId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Image not found."
            });
        }
        console.log(rows[0])
        // Delete from Cloudinary
        const cloudinaryResult = await deleteImageFromCloudinary(rows[0].image_url);

        if (!cloudinaryResult || cloudinaryResult.result !== "ok") {
            return res.status(500).json({
                success: false,
                message: "Failed to delete image from Cloudinary."
            });
        }

        // Soft delete
        await DB.promise().query(
            `DELETE FROM variant_images
            WHERE id = ?`,
            [imageId]
        );

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully."
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


export {
    uploadVariantImage,
    getVariantImages,
    deleteVariantImage
}