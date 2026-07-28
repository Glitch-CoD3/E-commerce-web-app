import DB from "../config/db.config.js";


/**
 * @POST createShippingAddress /api/v1/shipping-addresses
 * @description Create a new shipping address
 * @access Private
 */
const createShippingAddress = async (req, res) => {
    try {
        const user_id = req.user.id;

        const {
            full_address,
            state,
            city,
            zip_code,
        } = req.body;

        // Validation
        if (!full_address || !state || !city) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided."
            });
        }

        //check whether shipping address exists
        const [existShippingAddress] = await DB.promise().query(
            `SELECT user_id
            FROM shipping_addresses
            WHERE user_id = ?`,
            [user_id]
        );

        if (existShippingAddress.length > 2) {
            return res.status(409).json({
                success: false,
                message: "Shipping address already 2 exists. You can select one of them or Update them"
            });
        }

        const [result] = await DB.promise().query(
            `INSERT INTO shipping_addresses
            (user_id, full_address, state, city, zip_code)
            VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                full_address,
                state,
                city,
                zip_code || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Shipping address created successfully.",
            data: {
                id: result.insertId,
                user_id,
                full_address,
                state,
                city,
                zip_code: zip_code || null
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


/**
 * @PUT updateShippingAddress /api/v1/shipping-addresses/:id
 * @description Update an existing shipping address
 * @access Private
 */
const updateShippingAddress = async (req, res) => {
    try {
        const user_id = req.user.id;
        const address_id = req.params.id;

        const {
            full_address,
            city,
            state,
            is_default,
            zip_code
        } = req.body;

        // ===========================
        // Check Address Exists & Belongs to User
        // ===========================
        const [address] = await DB.promise().query(
            `SELECT id, full_address, city, state, zip_code, is_default
             FROM shipping_addresses
             WHERE id = ? AND user_id = ?`,
            [address_id, user_id]
        );

        if (address.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Shipping address not found."
            });
        }

        // ===========================
        // Helper: Check if value is truly provided
        // ===========================
        const isValid = (val) => val !== undefined && val !== null && String(val).trim() !== "";

        if (!isValid(full_address) && !isValid(city) && !isValid(state) && !isValid(zip_code) && is_default === undefined) {
            return res.status(400).json({
                success: false,
                message: "At least one valid field (full_address, city, state, zip_code, is_default) is required to update."
            });
        }

        // ===========================
        // Dynamic Update Construction
        // ===========================
        const updates = [];
        const params = [];

        if (isValid(full_address)) {
            updates.push("full_address = ?");
            params.push(String(full_address).trim());
        }
        if (isValid(city)) {
            updates.push("city = ?");
            params.push(String(city).trim());
        }
        if (isValid(state)) {
            updates.push("state = ?");
            params.push(String(state).trim());
        }
        if (isValid(zip_code)) {
            updates.push("zip_code = ?");
            params.push(String(zip_code).trim());
        }
        if (is_default !== undefined) {
            updates.push("is_default = ?");
            params.push(Boolean(is_default) ? 1 : 0);
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");

        // Handle transaction for resetting default address flags if setting this one to true
        const connection = await DB.promise().getConnection();

        try {
            await connection.beginTransaction();

            if (is_default === true || is_default === 1 || is_default === "1") {
                await connection.query(
                    `UPDATE shipping_addresses 
                     SET is_default = 0 
                     WHERE user_id = ? AND id != ?`,
                    [user_id, address_id]
                );
            }

            params.push(address_id, user_id);

            await connection.query(
                `UPDATE shipping_addresses
                 SET ${updates.join(", ")}
                 WHERE id = ? AND user_id = ?`,
                params
            );

            await connection.commit();
        } catch (txnError) {
            await connection.rollback();
            throw txnError;
        } finally {
            connection.release();
        }

        // ===========================
        // Fetch Updated Record
        // ===========================
        const [updatedAddress] = await DB.promise().query(
            `SELECT id, user_id, full_address, city, state, zip_code, is_default, created_at, updated_at
             FROM shipping_addresses
             WHERE id = ? AND user_id = ?`,
            [address_id, user_id]
        );

        return res.status(200).json({
            success: true,
            message: "Shipping address updated successfully.",
            data: updatedAddress[0],
            links: {
                self: `/api/v1/shipping-addresses/${address_id}`,
                user_addresses: `/api/v1/shipping-addresses`
            }
        });

    } catch (error) {
        console.error("Update Shipping Address Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


/**
 * @GET getShippingAddress /api/v1/shipping-addresses/:id
 * @description Get a specific shipping address
 * @access Private
 */
const getShippingAddressById = async (req, res) => {
    try {
        const user_id = req.user.id;
        const address_id = req.params.id;

        const [address] = await DB.promise().query(
            `SELECT id, full_address, city, state, zip_code
             FROM shipping_addresses
             WHERE id = ? AND user_id = ?`,
            [address_id, user_id]
        );

        if (address.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Shipping address not found."
            });
        }

        return res.status(200).json({
            success: true,
            address: address[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


/**
 * @GET getShippingAddress /api/v1/shipping-addresses/:user_id
 * @description Get a specific shipping address
 * @access Private
 */
const getShippingAddress = async (req, res) => {
    try {
        const user_id = req.params.id;

        const [address] = await DB.promise().query(
            `SELECT id, user_id, full_address, city, state, zip_code
             FROM shipping_addresses
             WHERE user_id = ?`,
            [user_id]
        );

        if (address.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Shipping address not found."
            });
        }

        return res.status(200).json({
            success: true,
            address: address[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


export {
    createShippingAddress,
    updateShippingAddress,
    getShippingAddress,
    getShippingAddressById
}

