import DB from "../config/db.config.js";

// Assuming DB connection is imported:
// const DB = require('../config/db');

/**
 * @method POST /api/v1/brands
 * @description Create a new brand
 * @access Private (Admin)
 */
const createBrand = async (req, res) => {
    try {
        const { brand_name, logo } = req.body;
        console.log(brand_name);

        if (!brand_name) {
            return res.status(400).json({
                success: false,
                message: 'Brand name is required.',
            });
        }

        // Check if brand already exists
        const [existing] = await DB.promise().query(
            'SELECT id FROM brands WHERE brand_name = ?',
            [brand_name]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Brand with this name already exists.',
            });
        }

        // Insert new brand
        const [result] = await DB.promise().query(
            'INSERT INTO brands (brand_name, logo) VALUES (?, ?)',
            [brand_name, logo || null]
        );

        return res.status(201).json({
            success: true,
            message: 'Brand created successfully.',
            data: {
                id: result.insertId,
                brand_name,
                logo: logo || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create brand.',
            error: error.message,
        });
    }
};

/**
 * @method GET /api/v1/brands
 * @description Get all brands (with pagination and search)
 * @access Public / Private
 */
const getAllBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        const searchParam = `%${search}%`;

        // Fetch brands and total count
        const [brands] = await DB.promise().query(
            'SELECT * FROM brands WHERE brand_name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
            [searchParam, limit, offset]
        );

        const [[{ total }]] = await DB.promise().query(
            'SELECT COUNT(*) AS total FROM brands WHERE brand_name LIKE ?',
            [searchParam]
        );

        return res.status(200).json({
            success: true,
            message: 'Brands fetched successfully.',
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                pageSize: limit,
            },
            data: brands,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve brands.',
            error: error.message,
        });
    }
};

/**
 * @method GET /api/v1/brands/:id
 * @description Get single brand by ID
 * @access Public / Private
 */
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await DB.promise().query(
            'SELECT * FROM brands WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Brand retrieved successfully.',
            data: rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving brand.',
            error: error.message,
        });
    }
};


/**
 * @method PATCH /api/v1/brands/:id
 * @description Dynamically update brand by ID without replacing fields with empty strings
 * @access Private (Admin)
 */

const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, logo } = req.body;

        // 1. Check if brand exists
        const [existing] = await DB.promise().query(
            'SELECT * FROM brands WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found.',
            });
        }

        // 2. Build dynamic update arrays only for non-empty values
        const fields = [];
        const values = [];

        // Only update brand_name if provided and not just empty whitespace
        if (brand_name !== undefined && brand_name.trim() !== '') {
            fields.push('brand_name = ?');
            values.push(brand_name.trim());
        }

        // Only update logo if provided and not just empty whitespace
        if (logo !== undefined && logo.trim() !== '') {
            fields.push('logo = ?');
            values.push(logo.trim());
        }

        // 3. If no valid non-empty fields were passed, return early
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid data provided to update.',
            });
        }

        // 4. Execute update query
        values.push(id);
        const sql = `UPDATE brands SET ${fields.join(', ')} WHERE id = ?`;

        await DB.promise().query(sql, values);

        // 5. Fetch and return updated record
        const [updatedBrand] = await DB.promise().query(
            'SELECT * FROM brands WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Brand updated successfully.',
            data: updatedBrand[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update brand.',
            error: error.message,
        });
    }
};

/**
 * @method DELETE /api/v1/brands/:id
 * @description Delete brand by ID
 * @access Private (Admin)
 */
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await DB.promise().query(
            'DELETE FROM brands WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Brand deleted successfully.',
            data: { id },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete brand.',
            error: error.message,
        });
    }
};

export {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
};