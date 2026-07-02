import DB from "../config/db.config.js";
import slugify from 'slugify'


/**
 * @method POST /api/v1/categories
 * @description Create a new category
 * @access Private (Admin)
 */
const createCategory = async (req, res) => {
    try {
        const {
            category_name,
            parent_category_id = null,
            status = "active"
        } = req.body;

        // Validation
        if (!category_name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required."
            });
        }

        let slug = slugify(category_name, {
            lower: true,
            strict: true,
            trim: true
        });

        // Check slug uniqueness
        const [slugExists] = await DB.promise().query(
            `SELECT id
             FROM categories
             WHERE url_slug = ?`,
            [slug]
        );

        if (slugExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "URL slug already exists."
            });
        }

        // Check parent category (optional)
        if (parent_category_id) {
            const [parent] = await DB.promise().query(
                `SELECT id
                 FROM categories
                 WHERE id = ?`,
                [parent_category_id]
            );

            if (parent.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Parent category not found."
                });
            }
        }

        // Insert category
        const [result] = await DB.promise().query(
            `INSERT INTO categories
            (category_name, url_slug, parent_category_id, status)
            VALUES (?, ?, ?, ?)`,
            [
                category_name,
                slug,
                parent_category_id,
                status
            ]
        );

        // Get total categories
        const [[{ total_categories }]] = await DB.promise().query(
            `SELECT COUNT(*) AS total_categories
            FROM categories`
        );

        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            total_caretories: total_categories,
            data: {
                id: result.insertId,
                category_name,
                slug,
                parent_category_id,
                status
            },
            links: {
                self: `/api/v1/categories/${result.insertId}`,
                all_categories: "/api/v1/categories",
                update: `/api/v1/categories/${result.insertId}`,
                delete: `/api/v1/categories/${result.insertId}`,
                products: `/api/v1/products?category_id=${result.insertId}`,
                create_product: "/api/v1/products"
            }
        });

    } catch (error) {
        console.error("Create Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @method GET /api/v1/categories
 * @description Retrieve all categories
 * @access Public
 */
const getAllCategories = async (req, res) => {
    try {
        const [categories] = await DB.promise().query(
            `SELECT *
             FROM categories WHERE deleted_at IS NULL
             ORDER BY id DESC`
        );

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
            links: {
                create: "/api/v1/categories",
                parents: "/api/v1/categories/parents"
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

/**
 * @method GET /api/v1/categories/:id
 * @description Retrieve a category by its ID
 * @access Public
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [category] = await DB.promise().query(
            `SELECT *
             FROM categories
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        const {
            deleted_at,
            updated_at,
            sort_order,
            created_at,
            ...categoryData
        } = category[0];

        return res.status(200).json({
            success: true,
            data: categoryData,
            links: {
                self: `/api/v1/categories/${id}`,
                update: `/api/v1/categories/${id}`,
                delete: `/api/v1/categories/${id}`,
                children: `/api/v1/categories/${id}/children`,
                products: `/api/v1/products?category_id=${id}`,
                create_product: "/api/v1/products"
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


/**
 * @method GET /api/v1/categories/slug/:slug
 * @description Retrieve a category by its URL slug
 * @access Public
 */
const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const [category] = await DB.promise().query(
            `SELECT *
             FROM categories
             WHERE url_slug = ? AND deleted_at IS NULL`,
            [slug]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        const {
            deleted_at,
            updated_at,
            sort_order,
            created_at,
            ...categoryData
        } = category[0];

        return res.status(200).json({
            success: true,
            data: categoryData,
            links: {
                self: `/api/v1/categories/slug/${slug}`,
                by_id: `/api/v1/categories/${category[0].id}`,
                products: `/api/v1/products?category_id=${category[0].id}`
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

/**
 * @method PUT /api/v1/categories/:id
 * @description Update a category by its ID
 * @access Private (Admin)
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category_name,
            url_slug,
            parent_category_id,
            status
        } = req.body;

        if (!category_name || !parent_category_id || !status || !url_slug) {
            return res.status(404).json({
                success: false,
                message: "category name, category id, status, url_slug, are required"
            });
        }

        const [exists] = await DB.promise().query(
            `SELECT *
             FROM categories
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        // Slug uniqueness
        if (url_slug) {
            const [slug] = await DB.promise().query(
                `SELECT id
                 FROM categories
                 WHERE url_slug = ?
                 AND id != ?`,
                [url_slug, id]
            );

            if (slug.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "URL slug already exists."
                });
            }
        }

        await DB.promise().query(
            `UPDATE categories
             SET category_name=?,
                 url_slug=?,
                 parent_category_id=?,
                 status=?
             WHERE id=?`,
            [
                category_name,
                url_slug,
                parent_category_id,
                status,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            links: {
                self: `/api/v1/categories/${id}`,
                products: `/api/v1/products?category_id=${id}`,
                children: `/api/v1/categories/${id}/children`
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


/**
 * @method DELETE /api/v1/categories/:id
 * @description Delete a category by its ID
 * @access Private (Admin)
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [exists] = await DB.promise().query(
            `SELECT id
             FROM categories
             WHERE id=?`,
            [id]
        );

        if (exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        await DB.promise().query(
            `UPDATE categories
            SET deleted_at = NOW()
            WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully.",
            links: {
                categories: "/api/v1/categories",
                create: "/api/v1/categories"
            }
        });
    }
};


/**
 * @method GET /api/v1/categories/parents
 * @description Retrieve all parent categories
 * @access Public
 */
const getParentCategories = async (req, res) => {
    try {
        const [parents] = await DB.promise().query(
            `SELECT *
             FROM categories
             WHERE parent_category_id IS NULL`
        );

        return res.status(200).json({
            success: true,
            count: parents.length,
            data: parents,
            links: {
                all: "/api/v1/categories",
                create: "/api/v1/categories"
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


/**
 * @method GET /api/v1/categories/:parentId/children
 * @description Retrieve all child categories under a parent category
 * @access Public
 */
const getChildCategories = async (req, res) => {
    try {
        const { parentId } = req.params;

        const [children] = await DB.promise().query(
            `SELECT *
             FROM categories
             WHERE parent_category_id = ?`,
            [parentId]
        );

        return res.status(200).json({
            success: true,
            count: children.length,
            data: children,
            links: {
                parent: `/api/v1/categories/${parentId}`,
                all_categories: "/api/v1/categories"
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
/**
 * 
 * @method POST api/v1/categories/deleted 
 * @description admin can see all the deleted categories
 * @access Admin Only 
 */

const getAllDeletedCategories = async (req, res) => {
    try {
        const [categories] = await DB.promise().query(
            `SELECT *
             FROM categories WHERE deleted_at IS NOT NULL
             ORDER BY id DESC`
        );

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
            links: {
                create: "/api/v1/categories",
                parents: "/api/v1/categories/parents"
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



export {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryBySlug,
    getParentCategories,
    getChildCategories,
    getAllDeletedCategories
}