import DB from '../config/db.config.js';

const getShippingAddressByUserId = async (user_id) => {
    try {
        const [rows] = await DB.promise().query(
            "SELECT id, full_address, phone_number, city, state, zip_code FROM shipping_addresses WHERE user_id = ?",
            [user_id]
        );

        return rows[0];
    } catch (error) {
        console.error("Error fetching shipping address:", error);
        throw error;
    }
};

export { getShippingAddressByUserId };