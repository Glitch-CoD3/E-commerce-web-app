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
            color,
            size,
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

        if (!color) {
            return res.status(400).json({
                success: false,
                message: "Product colors required"
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
             WHERE product_id = ? AND colors = ?`,
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
                colors,
                sizes,
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
                colors,
                sizes,
                price,
                stock_quantity
             FROM product_variants
             WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Product variant created successfully.",
            created_varient: variant[0],
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

/**
 * @method GET /api/v1/product-variants/details
 * @description Get all product variants with Product details
 * @access Private (Admin)
 */
const getAllProductVariantsWithProductDetails = async (req, res) => {
    try {
        let { page, limit, product_id } = req.query;


        page = Number(page || 1);
        limit = Number(limit || 10);
        const offset = (page - 1) * limit;

        // ===============================
        // Validation
        // ===============================
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: "Page and limit must be greater than 0."
            });
        }

        // ===============================
        // Build Query
        // ===============================
        let whereClause = "WHERE p.deleted_at IS NULL";
        let params = [];

        if (product_id) {
            whereClause += " AND pv.product_id = ?";
            params.push(product_id);
        }

        // ===============================
        // Total Count
        // ===============================
        const [countResult] = await DB.promise().query(
            `SELECT COUNT(*) AS total
             FROM product_variants pv
             INNER JOIN products p
                ON pv.product_id = p.id
             ${whereClause}`,
            params
        );

        const total = countResult[0].total;

        // ===============================
        // Get Variants
        // ===============================
        const [variants] = await DB.promise().query(
            `SELECT
                pv.id,
                pv.product_id,
                p.product_name,
                pv.colors,
                pv.sizes,
                pv.price,
                pv.stock_quantity,
                p.status AS product_status
            FROM product_variants pv
            INNER JOIN products p
                ON pv.product_id = p.id
            ${whereClause}
            ORDER BY pv.id DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // ===============================
        // Response
        // ===============================
        return res.status(200).json({
            success: true,
            message: "Product variants retrieved successfully.",
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            Total_vatient_with_productDetails: variants,
            links: {
                self: `/api/v1/product-variants?page=${page}&limit=${limit}`,
                next:
                    page * limit < total
                        ? `/api/v1/product-variants?page=${page + 1}&limit=${limit}`
                        : null,
                prev:
                    page > 1
                        ? `/api/v1/product-variants?page=${page - 1}&limit=${limit}`
                        : null
            }
        });

    } catch (error) {
        console.error("Get All Product Variants Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method GET /api/v1/product-variants/
 * @description Get all product variants with just Product id
 * @access Private (Admin)
 */
const getAllProductVariants = async (req, res) => {
    try {
        let { page, limit, product_id } = req.query;

        page = Number(page || 1);
        limit = Number(limit || 10);
        const offset = (page - 1) * limit;

        // Validation
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: "Page and limit must be greater than 0."
            });
        }

        // Build Query
        let whereClause = "";
        let params = [];

        if (product_id) {
            whereClause = "WHERE product_id = ?";
            params.push(product_id);
        }

        // Total Count
        const [countResult] = await DB.promise().query(
            `SELECT COUNT(*) AS total
             FROM product_variants
             ${whereClause}`,
            params
        );

        const total = countResult[0].total;

        // Get Variants
        const [variants] = await DB.promise().query(
            `SELECT
                id,
                product_id,
                colors,
                sizes,
                price,
                stock_quantity
            FROM product_variants
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Response
        return res.status(200).json({
            success: true,
            message: "Product variants retrieved successfully.",
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            all_product_varients: variants, // Fixed typo from 'vatient' to 'variants'
            links: {
                self: `/api/v1/product-variants?page=${page}&limit=${limit}${product_id ? `&product_id=${product_id}` : ''}`,
                next:
                    page * limit < total
                        ? `/api/v1/product-variants?page=${page + 1}&limit=${limit}${product_id ? `&product_id=${product_id}` : ''}`
                        : null,
                prev:
                    page > 1
                        ? `/api/v1/product-variants?page=${page - 1}&limit=${limit}${product_id ? `&product_id=${product_id}` : ''}`
                        : null
            }
        });

    } catch (error) {
        console.error("Get All Product Variants Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


const getProductVariantById = async (req, res) => {
    try {
        const { id } = req.params;

        // ===============================
        // Validation
        // ===============================
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid variant ID is required."
            });
        }

        // ===============================
        // Get Variant
        // ===============================
        const [variant] = await DB.promise().query(
            `SELECT
            id,
            product_id,
            colors,
            sizes,
            price,
            stock_quantity
            FROM product_variants WHERE id =?`,
            [id]
        )
        // ===============================
        // Check Exists
        // ===============================
        if (variant.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found."
            });
        }

        // ===============================
        // Response
        // ===============================
        return res.status(200).json({
            success: true,
            message: "Product variant retrieved successfully.",
            product_varient: variant[0],
            links: {
                self: `/api/v1/product-variants/${variant[0].id}`,
                product: `/api/v1/products/${variant[0].product_id}`,
                all_variants: `/api/v1/products/${variant[0].product_id}/variants`
            }
        });

    } catch (error) {
        console.error("Get Product Variant By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};



const getVariantsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        // ===========================
        // Validate Product ID
        // ===========================
        if (!productId || isNaN(Number(productId))) {
            return res.status(400).json({
                success: false,
                message: "A valid numeric Product ID is required."
            });
        }

        // ===========================
        // Check Product Existence
        // ===========================
        const [product] = await DB.promise().query(
            `SELECT id FROM products WHERE id = ?`,
            [productId]
        );

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        // ===========================
        // Fetch All Variants
        // ===========================
        const [variants] = await DB.promise().query(
            `SELECT id, product_id, colors, sizes, price, stock_quantity, created_at, updated_at
             FROM product_variants
             WHERE product_id = ?
             ORDER BY id ASC`,
            [productId]
        );

        // Optional: Return empty array or 404 depending on your preferred API design
        if (variants.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No variants found for this product.",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product variants retrieved successfully.",
            count: variants.length,
            varients: variants,
            links: {
                self: `/api/v1/products/${productId}/variants`,
                product: `/api/v1/products/${productId}`
            }
        });

    } catch (error) {
        console.error("Get Variants By Product ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method PATCH /api/v1/product-variants/:id
 * @description Update a product variant
 * @access Private (Admin)
 */
const updateProductVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            color,
            size,
            price,
            stock_quantity
        } = req.body;

        // ===========================
        // Check Variant Exists
        // ===========================
        const [variant] = await DB.promise().query(
            `SELECT id, product_id, colors, sizes, price, stock_quantity
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
        // Helper: Check if value is truly provided
        // ===========================
        const isValid = (val) => val !== undefined && val !== null && String(val).trim() !== "";

        if (!isValid(color) && !isValid(size) && !isValid(price) && !isValid(stock_quantity)) {
            return res.status(400).json({
                success: false,
                message: "At least one valid field (color, size, price, stock_quantity) is required to update."
            });
        }

        // ===========================
        // Validate Size against Allowed List
        // ===========================
        const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

        if (isValid(size)) {
            const formattedSize = String(size).trim().toUpperCase();
            if (!ALLOWED_SIZES.includes(formattedSize)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid size '${size}'. Allowed sizes are: ${ALLOWED_SIZES.join(", ")}.`
                });
            }
        }

        if (isValid(price) && Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0."
            });
        }

        if (isValid(stock_quantity) && Number(stock_quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity cannot be negative."
            });
        }

        // ===========================
        // Check Duplicate Variant (Color + Size Combination)
        // ===========================
        const targetColor = isValid(color) ? color.trim() : variant[0].colors;
        const targetSize = isValid(size) ? String(size).trim().toUpperCase() : variant[0].sizes;

        // Perform duplicate check if either color or size is being updated
        if ((isValid(color) && targetColor !== variant[0].colors) ||
            (isValid(size) && targetSize !== variant[0].sizes)) {

            const [exists] = await DB.promise().query(
                `SELECT id
                 FROM product_variants
                 WHERE product_id = ?
                 AND colors = ?
                 AND sizes = ?
                 AND id != ?`,
                [
                    variant[0].product_id,
                    targetColor,
                    targetSize,
                    id
                ]
            );

            if (exists.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `A variant with color '${targetColor}' and size '${targetSize}' already exists for this product.`
                });
            }
        }

        // ===========================
        // Dynamic Update Query
        // ===========================
        const updates = [];
        const params = [];

        if (isValid(color)) {
            updates.push("colors = ?");
            params.push(color.trim());
        }
        if (isValid(size)) {
            updates.push("sizes = ?");
            params.push(String(size).trim().toUpperCase());
        }
        if (isValid(price)) {
            updates.push("price = ?");
            params.push(Number(price));
        }
        if (isValid(stock_quantity)) {
            updates.push("stock_quantity = ?");
            params.push(Number(stock_quantity));
        }

        params.push(id);

        await DB.promise().query(
            `UPDATE product_variants
             SET ${updates.join(", ")}
             WHERE id = ?`,
            params
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
            updated_varient: updated[0],
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
    getAllProductVariantsWithProductDetails,
    updateProductVariant,
    deleteProductVariant
};