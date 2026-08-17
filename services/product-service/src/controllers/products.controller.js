import DB from "../config/db.config.js";
import slugify from "slugify";

/**
 * @method POST /api/v1/products
 * @description Create a new product
 * @access Private (Admin)
 */
const createProduct = async (req, res) => {
    try {
        const {
            category_id,
            brand_id,
            product_name,
            short_description,
            description,
            price,
            stock_quantity,
            status
        } = req.body;

        if (
            !category_id ||
            !product_name ||
            !price || !brand_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Category Id,Brand Id, product name, price and stock quantity are required."
            });
        }

        if (stock_quantity === undefined || Number(stock_quantity) < 0) {
            return res.status(400).json({
                success: false,
                message:
                    "stock quantity is required and never be Negative."
            });
        }

        // Check category exists
        const [category] = await DB.promise().query(
            `SELECT id
             FROM categories
             WHERE id = ?
             LIMIT 1`,
            [category_id]
        );

        if (!category.length) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }


        // Check brand exists
        const [brand] = await DB.promise().query(
            `SELECT id, brand_name
             FROM brands
             WHERE id = ?
             LIMIT 1`,
            [brand_id]
        );

        if (!brand.length) {
            return res.status(404).json({
                success: false,
                message: "Brand not found."
            });
        }

        const brand_name = brand[0].brand_name;

        // Generate slug
        let slug = slugify(product_name, {
            lower: true,
            strict: true,
            trim: true
        });

        // Check slug uniqueness
        const [existingSlug] = await DB.promise().query(
            `SELECT id
             FROM products
             WHERE url_slug = ?
             LIMIT 1`,
            [slug]
        );

        if (existingSlug.length) {
            slug = `${slug}-${Date.now()}`;
        }

        const productStatus = Number(stock_quantity) > 0 ? "active" : "inactive";


        const [result] = await DB.promise().query(
            `INSERT INTO products
            (
                category_id,
                brand_id,
                product_name,
                url_slug,
                description,
                short_description,
                price,
                stock_quantity,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                brand_id,
                product_name,
                slug,
                description || "",
                short_description || "",
                price,
                stock_quantity,
                productStatus
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            created_product: {
                id: result.insertId,
                category_id,
                brand_id,
                brand_name,
                product_name,
                url_slug: slug,
                description,
                short_description,
                price,
                stock_quantity,
                status: productStatus
            },
            links: {
                self: `/api/v1/products/${result.insertId}`,
                bySlug: `/api/v1/products/slug/${slug}`,
                update: `/api/v1/products/${result.insertId}`,
                delete: `/api/v1/products/${result.insertId}`,
                allProducts: `/api/v1/products`
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


const getAllProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        let whereClause = `WHERE p.deleted_at IS NULL`;
        let values = [];

        // Search
        if (search) {
            whereClause += `
                AND (
                    p.product_name LIKE ?
                    OR p.description LIKE ?
                    OR p.url_slug LIKE ?
                )`;

            const keyword = `%${search}%`;
            values.push(keyword, keyword, keyword);
        }

        // Total products count
        const [countResult] = await DB.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM products p
            ${whereClause}
            `,
            values
        );

        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch products with aggregated sizes, colors, and images
        const [rows] = await DB.promise().query(
            `
           SELECT
    p.id,
    p.product_name AS name,
    p.short_description AS shortDescription,
    p.description,
    p.price,
    p.stock_quantity,
    p.category_id,
    p.url_slug,
    p.status,
    c.category_name,
    c.url_slug AS category_slug,
    b.id AS brand_id,
    b.brand_name,
    b.logo AS brand_logo,
    
    -- Added: Total Variants Count
    (
        SELECT COUNT(*)
        FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
    ) AS total_variants,

    (
        SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', pv.sizes, '"')), ']')
        FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
    ) AS sizes,
    (
        SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', pv.colors, '"')), ']')
        FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
    ) AS colors,
    (
        SELECT CONCAT('{', GROUP_CONCAT(DISTINCT CONCAT('"', pv.colors, '":"', iv.image_url, '"')), '}')
        FROM product_variants pv
        JOIN variant_images iv ON iv.product_variant_id = pv.id
        WHERE pv.product_id = p.id 
          AND pv.deleted_at IS NULL 
          AND iv.deleted_at IS NULL
    ) AS images,
    (
        SELECT CONCAT('[', GROUP_CONCAT(pv.stock_quantity), ']')
        FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
    ) AS variant_stocks,
    (
        SELECT CONCAT('[', GROUP_CONCAT(pv.price), ']')
        FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
    ) AS variant_prices
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
${whereClause}
ORDER BY p.created_at DESC
LIMIT ?
OFFSET ?
            `,
            [...values, limit, offset]
        );

        // Format and parse JSON fields for each product
        const formattedProducts = rows.map((product) => {
            try {
                product.sizes = product.sizes ? JSON.parse(product.sizes) : [];
                product.colors = product.colors ? JSON.parse(product.colors) : [];
                product.images = product.images ? JSON.parse(product.images) : {};
            } catch (parseErr) {
                console.error("JSON Parsing Error for product ID", product.id, parseErr);
                product.sizes = [];
                product.colors = [];
                product.images = {};
            }
            return product;
        });

        return res.status(200).json({
            success: true,
            message: formattedProducts.length
                ? "Products fetched successfully."
                : "No products found.",

            meta: {
                total_products: totalProducts,
                total_pages: totalPages,
                current_page: page,
                per_page: limit,
                search
            },

            all_products: formattedProducts,

            links: {
                self: `/api/v1/products?page=${page}&limit=${limit}&search=${search}`,
                first: `/api/v1/products?page=1&limit=${limit}&search=${search}`,
                last: `/api/v1/products?page=${totalPages}&limit=${limit}&search=${search}`,
                previous:
                    page > 1
                        ? `/api/v1/products?page=${page - 1}&limit=${limit}&search=${search}`
                        : null,
                next:
                    page < totalPages
                        ? `/api/v1/products?page=${page + 1}&limit=${limit}&search=${search}`
                        : null
            }
        });

    } catch (error) {
        console.error("Get All Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};
/**
 * @method GET /api/v1/products
 * @description Retrieve all products
 * @access Public
 */
// const getAllProducts = async (req, res) => {
//     try {
//         const page = Number(req.query.page) || 1;
//         const limit = Number(req.query.limit) || 10;
//         const search = req.query.search || "";

//         const offset = (page - 1) * limit;

//         let whereClause = `WHERE p.deleted_at IS NULL`;
//         let values = [];

//         // Search
//         if (search) {
//             whereClause += `
//                 AND (
//                     p.product_name LIKE ?
//                     OR p.description LIKE ?
//                     OR p.url_slug LIKE ?
//                 )`;

//             const keyword = `%${search}%`;
//             values.push(keyword, keyword, keyword);
//         }

//         // Total products
//         const [countResult] = await DB.promise().query(
//             `
//             SELECT COUNT(*) AS total
//             FROM products p
//             ${whereClause}
//             `,
//             values
//         );

//         const totalProducts = countResult[0].total;
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Get products
//         const [products] = await DB.promise().query(
//             `
//     SELECT
//         p.*,
//         c.category_name,
//         c.url_slug AS category_slug,
//         b.brand_name AS brand_name,
//         b.*
//     FROM products p
//     LEFT JOIN categories c
//         ON p.category_id = c.id
//     LEFT JOIN brands b
//         ON p.brand_id = b.id
//     ${whereClause}
//     ORDER BY p.created_at DESC
//     LIMIT ?
//     OFFSET ?
//     `,
//             [...values, limit, offset]
//         );



//         return res.status(200).json({
//             success: true,
//             message: products.length
//                 ? "Products fetched successfully."
//                 : "No products found.",

//             meta: {
//                 total_products: totalProducts,
//                 total_pages: totalPages,
//                 current_page: page,
//                 per_page: limit,
//                 search
//             },

//             all_products: products,

//             links: {
//                 self: `/api/v1/products?page=${page}&limit=${limit}&search=${search}`,
//                 first: `/api/v1/products?page=1&limit=${limit}&search=${search}`,
//                 last: `/api/v1/products?page=${totalPages}&limit=${limit}&search=${search}`,
//                 previous:
//                     page > 1
//                         ? `/api/v1/products?page=${page - 1}&limit=${limit}&search=${search}`
//                         : null,
//                 next:
//                     page < totalPages
//                         ? `/api/v1/products?page=${page + 1}&limit=${limit}&search=${search}`
//                         : null
//             }
//         });

//     } catch (error) {
//         console.error(error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error."
//         });
//     }
// };


/**
 * @method GET /api/v1/products/:id
 * @description Retrieve a product by its ID with images, colors, brand everything
 * @access Public
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required."
            });
        }

        const [rows] = await DB.promise().query(
            `
            SELECT 
                p.id,
                p.product_name AS name,
                p.short_description AS shortDescription,
                p.description,
                p.price,
                p.category_id,
                p.url_slug,
                c.category_name,
                c.url_slug AS category_slug,
                b.id AS brand_id,
                b.brand_name,
                b.logo AS brand_logo,
                (
                    SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', pv.sizes, '"')), ']')
                    FROM product_variants pv 
                    WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
                ) AS sizes,
                (
                    SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', pv.colors, '"')), ']')
                    FROM product_variants pv 
                    WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
                ) AS colors,
                (
                    SELECT CONCAT('{', GROUP_CONCAT(DISTINCT CONCAT('"', pv.colors, '":"', iv.image_url, '"')), '}')
                    FROM product_variants pv
                    JOIN variant_images iv ON iv.product_variant_id = pv.id
                    WHERE pv.product_id = p.id 
                      AND pv.deleted_at IS NULL 
                      AND iv.deleted_at IS NULL
                ) AS images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.id = ? AND p.deleted_at IS NULL
            LIMIT 1
            `,
            [id]
        );

        if (!rows.length || !rows[0].id) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = rows[0];

        // Parse MariaDB string representations into Javascript Objects / Arrays
        try {
            product.sizes = product.sizes ? JSON.parse(product.sizes) : [];
            product.colors = product.colors ? JSON.parse(product.colors) : [];
            product.images = product.images ? JSON.parse(product.images) : {};
        } catch (parseErr) {
            console.error("JSON Parsing Error:", parseErr);
        }

        return res.status(200).json({
            success: true,
            message: "Product retrieved successfully.",
            product: product,
            links: {
                self: `/api/v1/products/${id}`,
                bySlug: `/api/v1/products/slug/${product.url_slug}`,
                category: `/api/v1/categories/${product.category_id}`,
                update: `/api/v1/products/${id}`,
                updateStatus: `/api/v1/products/${id}/status`,
                delete: `/api/v1/products/${id}`,
                allProducts: "/api/v1/products"
            }
        });

    } catch (error) {
        console.error("Get Product By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method GET /api/v1/products/slug/:slug
 * @description Retrieve a product by its URL slug
 * @access Public
 */
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Product slug is required."
            });
        }

        const [product] = await DB.promise().query(
            `
            SELECT
                p.*,
            c.category_name,
            c.url_slug AS category_slug
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.url_slug = ?
            AND p.deleted_at IS NULL
            LIMIT 1
            `,
            [slug]
        );

        if (!product.length) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product retrieved successfully.",
            product: product[0],
            links: {
                self: `/ api / v1 / products / slug / ${slug}`,
                byId: `/ api / v1 / products / ${product[0].id}`,
                category: `/ api / v1 / categories / ${product[0].category_id}`,
                update: `/ api / v1 / products / ${product[0].id}`,
                updateStatus: `/ api / v1 / products / ${product[0].id} / status`,
                delete: `/ api / v1 / products / ${product[0].id}`,
                allProducts: "/api/v1/products"
            }
        });

    } catch (error) {
        console.error("Get Product By Slug Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method PATCH /api/v1/products/:id
 * @description Update a product by its ID
 * @access Private (Admin)
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required."
            });
        }

        // Check product exists
        const [products] = await DB.promise().query(
            `SELECT *
        FROM products
             WHERE id = ?
            AND deleted_at IS NULL
             LIMIT 1`,
            [id]
        );

        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const existingProduct = products[0];

        const updateFields = [];
        const values = [];

        // Allowed fields for PATCH
        const allowedFields = [
            "category_id",
            "product_name",
            "description",
            "short_description",
            "price",
            "stock_quantity",
            "status"
        ];

        for (const field of allowedFields) {

            // Skip fields not included in request
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
                continue;
            }

            const value = req.body[field];

            switch (field) {

                case "category_id": {

                    const [category] = await DB.promise().query(
                        `SELECT id
                         FROM categories
                         WHERE id = ?
            AND deleted_at IS NULL
                         LIMIT 1`,
                        [value]
                    );

                    if (!category.length) {
                        return res.status(404).json({
                            success: false,
                            message: "Category not found."
                        });
                    }

                    updateFields.push("category_id = ?");
                    values.push(value);
                    break;
                }

                case "product_name": {

                    updateFields.push("product_name = ?");
                    values.push(value);

                    if (value !== existingProduct.product_name) {

                        let slug = slugify(value, {
                            lower: true,
                            strict: true,
                            trim: true
                        });

                        const [slugExists] = await DB.promise().query(
                            `SELECT id
                             FROM products
                             WHERE url_slug = ?
            AND id != ?
            LIMIT 1`,
                            [slug, id]
                        );

                        if (slugExists.length) {
                            slug = `${slug} - ${Date.now()}`;
                        }

                        updateFields.push("url_slug = ?");
                        values.push(slug);
                    }

                    break;
                }

                default:
                    updateFields.push(`${field} = ? `);
                    values.push(value);
            }
        }

        if (!updateFields.length) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update."
            });
        }

        updateFields.push("updated_at = NOW()");
        values.push(id);

        await DB.promise().query(
            `UPDATE products
             SET ${updateFields.join(", ")}
             WHERE id = ? `,
            values
        );

        const [updatedProducts] = await DB.promise().query(
            `SELECT
                p.*,
            c.category_name,
            c.url_slug AS category_slug
             FROM products p
             LEFT JOIN categories c
                ON p.category_id = c.id
             WHERE p.id = ?
            LIMIT 1`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            updated_product: updatedProducts[0],
            links: {
                self: `/ api / v1 / products / ${id}`,
                by_slug: `/ api / v1 / products / slug / ${updatedProducts[0].url_slug}`,
                category: `/ api / v1 / categories / ${updatedProducts[0].category_id}`,
                all_products: "/api/v1/products",
                delete: `/ api / v1 / products / ${id}`
            }
        });

    } catch (error) {
        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method DELETE /api/v1/products/:id
 * @description Delete a product by its ID
 * @access Private (Admin)
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required."
            });
        }

        // Check if product exists
        const [product] = await DB.promise().query(
            `SELECT id, product_name
             FROM products
             WHERE id = ?
            AND deleted_at IS NULL
             LIMIT 1`,
            [id]
        );

        if (!product.length) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        // Soft delete
        await DB.promise().query(
            `UPDATE products
             SET deleted_at = NOW()
             WHERE id = ? `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
            deleted_product: {
                id: Number(id),
                product_name: product[0].product_name,
                deleted_at: new Date().toISOString()
            },
            links: {
                allProducts: "/api/v1/products",
                create: "/api/v1/products/create-product"
            }
        });

    } catch (error) {
        console.error("Delete Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method PATCH /api/v1/products/:id/status
 * @description Update the status of a product
 * @access Private (Admin)
 */

const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate product ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required."
            });
        }

        // Validate status
        if (typeof status !== "string" || status.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Product status is required."
            });
        }

        const normalizedStatus = status.trim().toLowerCase();

        const allowedStatuses = [
            "inactive",
            "active",
            "discontinued"
        ];

        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status.Allowed values are: ${allowedStatuses.join(", ")}`
            });
        }

        // Check product exists
        const [products] = await DB.promise().query(
            `SELECT id, status
             FROM products
             WHERE id = ?
            AND deleted_at IS NULL
             LIMIT 1`,
            [id]
        );

        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = products[0];

        // Check if status is already the same
        if (product.status === normalizedStatus) {
            return res.status(200).json({
                success: true,
                message: "Product status is already up to date.",
                data: {
                    id: Number(id),
                    status: product.status
                }
            });
        }

        // Update status
        await DB.promise().query(
            `UPDATE products
             SET status = ?,
            updated_at = NOW()
             WHERE id = ? `,
            [normalizedStatus, id]
        );

        return res.status(200).json({
            success: true,
            message: "Product status updated successfully.",
            updated_status: {
                id: Number(id),
                status: normalizedStatus
            },
            links: {
                self: `/ api / v1 / products / ${id}`,
                product: `/ api / v1 / products / ${id}`,
                update: `/ api / v1 / products / ${id}`,
                delete: `/ api / v1 / products / ${id}`,
                allProducts: "/api/v1/products"
            }
        });

    } catch (error) {
        console.error("Update Product Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

/**
 * @method GET /api/v1/products/category/:categoryId
 * @description Retrieve all products belonging to a category
 * @access Public
 */

const getProductsByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        if (!categoryId || isNaN(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Valid category ID is required."
            });
        }

        // Check category exists
        const [category] = await DB.promise().query(
            `SELECT id, category_name
             FROM categories
             WHERE id = ?
            LIMIT 1`,
            [categoryId]
        );

        if (!category.length) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        let whereClause = `
            WHERE p.category_id = ?
            AND p.deleted_at IS NULL
            `;

        const values = [categoryId];

        if (search) {
            whereClause += `
                AND(
                p.product_name LIKE ?
                OR p.description LIKE ?
                OR p.url_slug LIKE ?
                )
                `;

            const keyword = `% ${search} % `;
            values.push(keyword, keyword, keyword);
        }

        // Total products
        const [countResult] = await DB.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM products p
            ${whereClause}
            `,
            values
        );

        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch products
        const [products] = await DB.promise().query(
            `
            SELECT
                p.*,
            c.category_name,
            c.url_slug AS category_slug
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ?
                OFFSET ?
                    `,
            [...values, limit, offset]
        );

        return res.status(200).json({
            success: true,
            message: products.length
                ? "Products retrieved successfully."
                : "No products found in this category.",

            meta: {
                category_id: Number(categoryId),
                category_name: category[0].category_name,
                total_products: totalProducts,
                total_pages: totalPages,
                current_page: page,
                per_page: limit,
                search
            },

            products: products,

            links: {
                self: `/ api / v1 / products / category / ${categoryId} ? page = ${page} & limit=${limit} & search=${search}`,
                category: `/ api / v1 / categories / ${categoryId}`,
                allProducts: "/api/v1/products",
                first: `/ api / v1 / products / category / ${categoryId} ? page = 1 & limit=${limit} & search=${search}`,
                last: `/ api / v1 / products / category / ${categoryId} ? page = ${totalPages} & limit=${limit} & search=${search}`,
                previous: page > 1
                    ? `/ api / v1 / products / category / ${categoryId} ? page = ${page - 1}& limit=${limit}& search=${search} `
                    : null,
                next: page < totalPages
                    ? `/ api / v1 / products / category / ${categoryId}?page = ${page + 1}& limit=${limit}& search=${search} `
                    : null
            }
        });

    } catch (error) {
        console.error("Get Products By Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method GET /api/v1/products/deleted
 * @description Get all soft deleted products
 * @access Private (Admin)
 */
const getAllDeletedProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        let whereClause = `WHERE p.deleted_at IS NOT NULL`;
        let values = [];

        if (search) {
            whereClause += `
    AND(
        p.product_name LIKE ?
        OR p.description LIKE ?
        OR p.url_slug LIKE ?
                )
        `;

            const keyword = `% ${search}% `;
            values.push(keyword, keyword, keyword);
        }

        // Total deleted products
        const [countResult] = await DB.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM products p
            ${whereClause}
    `,
            values
        );

        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch deleted products
        const [products] = await DB.promise().query(
            `
    SELECT
    p.*,
        c.category_name,
        c.url_slug AS category_slug
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.deleted_at DESC
    LIMIT ?
        OFFSET ?
            `,
            [...values, limit, offset]
        );

        return res.status(200).json({
            success: true,
            message: products.length
                ? "Deleted products fetched successfully."
                : "No deleted products found.",

            meta: {
                total_deleted_products: totalProducts,
                total_pages: totalPages,
                current_page: page,
                per_page: limit,
                search
            },

            All_deleted_product: products,

            links: {
                self: `/ api / v1 / products / deleted ? page = ${page}& limit=${limit}& search=${search} `,
                first: `/ api / v1 / products / deleted ? page = 1 & limit=${limit}& search=${search} `,
                last: `/ api / v1 / products / deleted ? page = ${totalPages}& limit=${limit}& search=${search} `,
                previous:
                    page > 1
                        ? `/ api / v1 / products / deleted ? page = ${page - 1}& limit=${limit}& search=${search} `
                        : null,
                next:
                    page < totalPages
                        ? `/ api / v1 / products / deleted ? page = ${page + 1}& limit=${limit}& search=${search} `
                        : null
            }
        });

    } catch (error) {
        console.error("Get Deleted Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


export {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    getProductsByCategoryId,
    getAllDeletedProducts
}