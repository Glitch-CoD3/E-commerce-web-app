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



        // Check if the address belongs to the authenticated user
        const [address] = await DB.promise().query(
            `SELECT id
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

        // Update address
        await DB.promise().query(
            `UPDATE shipping_addresses
             SET
                full_address = ?,
                city = ?,
                state = ?,
                is_default = ?,
                zip_code = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                full_address,
                city,
                state,
                is_default,
                zip_code || null,
                address_id
            ]
        );

        const [Updated_address] = await DB.promise().query(
            `SELECT id, full_address, city, state, zip_code, is_default
             FROM shipping_addresses
             WHERE id = ? AND user_id = ?`,
            [address_id, user_id]
        );

        return res.status(200).json({
            success: true,
            address: Updated_address[0],
            message: "Shipping address updated successfully."
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

