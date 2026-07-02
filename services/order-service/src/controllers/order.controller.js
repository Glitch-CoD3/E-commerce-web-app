import DB from "../config/db.config.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


/**
 * @method POST /api/v1/order
 * @description Create a new order for the authenticated user.
 * @access Private (Authenticated User)
 */

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            shipping_address_id,
            payment_method
        } = req.body;

        // 1. Get cart from Cart Service
        // const cart = await axios.get(...);

        // 2. Validate cart

        // 3. Get latest product information from Product Service

        // 4. Calculate subtotal & total

        // 5. Get shipping address

        // 6. Start DB transaction

        // 7. Insert into orders

        // 8. Insert into order_items

        // 9. Copy shipping address into order_shipping_addresses

        // 10. Commit transaction

        // 11. Notify Product Service to reduce stock

        // 12. Notify Cart Service to clear cart

        res.status(201).json({
            success: true,
            message: "Order created successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};