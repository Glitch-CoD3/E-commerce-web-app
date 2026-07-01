import DB from "../config/db.config.js";

/**
 * @method POST /api/v1/product-variants
 * @description Create a product variant
 * @access Private (Admin)
 */
const createProductVariant = async (req, res) => {
    try {
        const {
            product_id,
            color = null,
            size = null,
            price,
            stock_quantity
        } = req.body;

        // ===============================
        // Validation
        // ===============================
        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required."
            });
        }

        if (price === undefined || price === null || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid price is required."
            });
        }

        if (
            stock_quantity === undefined ||
            stock_quantity === null ||
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid stock quantity is required."
            });
        }

        // ===============================
        // Check Product
        // ===============================
        const [product] = await DB.promise().query(
            `SELECT id, status, stock_quantity
             FROM products
             WHERE id = ?
             AND deleted_at IS NULL`,
            [product_id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        if (product[0].status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Cannot create variant for an inactive product."
            });
        }

        // ===============================
        // Prevent Duplicate Variant
        // ===============================
        const [exists] = await DB.promise().query(
            `SELECT id
             FROM product_variants
             WHERE product_id = ? AND color = ?`,
            [
                product_id,
                color
            ]
        );
        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This variant already exists."
            });
        }

        // ===============================
        // Insert Variant
        // ===============================
        const [result] = await DB.promise().query(
            `INSERT INTO product_variants
            (
                product_id,
                color,
                size,
                price,
                stock_quantity
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                product_id,
                color,
                size,
                price,
                stock_quantity
            ]
        );

        // ===============================
        // Fetch Created Variant
        // ===============================
        const [variant] = await DB.promise().query(
            `SELECT
                id,
                product_id,
                color,
                size,
                price,
                stock_quantity
             FROM product_variants
             WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Product variant created successfully.",
            data: variant[0],
            links: {
                self: `/api/v1/product-variants/${variant[0].id}`,
                product: `/api/v1/products/${product_id}`,
                all_variants: `/api/v1/products/${product_id}/variants`
            }
        });

    } catch (error) {
        console.error("Create Product Variant Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


const getAllProductVariants = async (req, res) => {

};

const getProductVariantById = async (req, res) => {

};

const getVariantsByProductId = async (req, res) => {

};


/**
 * @method PUT /api/v1/product-variants/:id
 * @description Update a product variant
 * @access Private (Admin)
 */
const updateProductVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            color = null,
            size = null,
            price,
            stock_quantity
        } = req.body;

        // ===========================
        // Check Variant Exists
        // ===========================
        const [variant] = await DB.promise().query(
            `SELECT id, product_id
             FROM product_variants
             WHERE id = ?`,
            [id]
        );

        if (variant.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found."
            });
        }

        // ===========================
        // Validate Input
        // ===========================
        if (price !== undefined && Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0."
            });
        }

        if (
            stock_quantity !== undefined &&
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity cannot be negative."
            });
        }

        // ===========================
        // Check Duplicate Color
        // ===========================
        if (color) {
            const [exists] = await DB.promise().query(
                `SELECT id
                 FROM product_variants
                 WHERE product_id = ?
                 AND color = ?
                 AND id != ?`,
                [
                    variant[0].product_id,
                    color,
                    id
                ]
            );

            if (exists.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A variant with this color already exists."
                });
            }
        }

        // ===========================
        // Update Variant
        // ===========================
        await DB.promise().query(
            `UPDATE product_variants
             SET
                color = ?,
                size = ?,
                price = ?,
                stock_quantity = ?
             WHERE id = ?`,
            [
                color,
                size,
                price,
                stock_quantity,
                id
            ]
        );

        // ===========================
        // Return Updated Variant
        // ===========================
        const [updated] = await DB.promise().query(
            `SELECT *
             FROM product_variants
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Product variant updated successfully.",
            data: updated[0],
            links: {
                self: `/api/v1/product-variants/${id}`,
                product: `/api/v1/products/${updated[0].product_id}`,
                all_variants: `/api/v1/products/${updated[0].product_id}/variants`
            }
        });

    } catch (error) {
        console.error("Update Product Variant Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method DELETE /api/v1/product-variants/:id
 * @description Delete a product variant
 * @access Private (Admin)
 */
const deleteProductVariant = async (req, res) => {
    try {
        const { id } = req.params;

        // ===========================
        // Check Variant Exists
        // ===========================
        const [variant] = await DB.promise().query(
            `SELECT id
             FROM product_variants
             WHERE id = ?`,
            [id]
        );

        if (variant.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found."
            });
        }

        // ===========================
        // Delete Variant
        // ===========================
        await DB.promise().query(
            `DELETE FROM product_variants
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Product variant deleted successfully.",
            links: {
                all_variants: "/api/v1/product-variants"
            }
        });

    } catch (error) {
        console.error("Delete Product Variant Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

export {
    createProductVariant,
    getAllProductVariants,
    getProductVariantById,
    getVariantsByProductId,
    updateProductVariant,
    deleteProductVariant
};