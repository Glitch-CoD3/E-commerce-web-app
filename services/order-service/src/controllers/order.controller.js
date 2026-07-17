import DB from '../config/db.config.js'
import { getAllCart } from '../utils/axiosClient.js'
import { getProductsByIds } from '../utils/product.api.js'
import { getShippingAddressByUserId } from '../utils/getShippingAddress.api.js'

/**
 * @method POST /api/v1/order
 * @description Create a new order for the authenticated user.
 * @access Private (Authenticated User)
 */

const createOrder = async (req, res) => {
    try {

        if (!req.body) {
            return res.status(401).json({
                success: false,
                message: " Mo data field passes from req.body "
            })
        }

        const { full_address, state, city, zip } = req.body

        if (!full_address || !state || !city) {
            return res.status(401).json({
                success: false,
                message: " Full address, state and city are required "
            })
        }

        const order_shipping_Address = {
            full_address,
            state,
            city,
            zip
        }



        const connection = await DB.promise().getConnection();
        const token = req.cookies.refreshToken || req.headers.authorization?.split(' ')[1];

        //---------------------------------------------------
        // 1. Get Cart
        //---------------------------------------------------

        const carts = await getAllCart(token);

        if (carts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        //---------------------------------------------------
        // 2. Get latest products
        //---------------------------------------------------

        const productIds = carts.data.map(item => item.product_id);

        //---------------------------------------------------
        // 3. Validate products
        //---------------------------------------------------

        const products = [];

        for (const id of productIds) {

            const product = await getProductsByIds(id, token);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${id} not found`
                });
            }

            const cartItem = carts.data.find(
                item => item.product_id === id
            );

            if (product.stock_quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.product_name} has only ${product.stock_quantity} items in stock`
                });
            }

            products.push(product);
        }


        //---------------------------------------------------
        // 4. Create Order Items
        //---------------------------------------------------

        const orderItems = [];

        for (const cartItem of carts.data) {

            const product = products.find(
                p => p.id === cartItem.product_id
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${cartItem.product_id} not found`
                });
            }

            orderItems.push({
                product_id: product.id,
                product_variant_id: cartItem.product_variant_id,
                product_name: product.product_name,
                product_image: product.product_image,
                price: product.price,
                quantity: cartItem.quantity,
                total_amount: product.price * cartItem.quantity
            });
        }

        //---------------------------------------------------
        // 5. Calculate subtotal
        //---------------------------------------------------

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.total_amount,
            0
        );

        const shippingAddress = await getShippingAddressByUserId(req.user.id);

        if (!shippingAddress) {
            return res.status(404).json({
                success: false,
                message: "Shipping address not found"
            });
        }

        //---------------------------------------------------
        // 6. shipping address
        //---------------------------------------------------

        const ShippingState = order_shipping_Address.state || shippingAddress.state;

        const shippingFee = ShippingState?.toLowerCase() === "dhaka" ? 60 : 120;


        const total = subtotal + shippingFee;

        //---------------------------------------------------
        // 6. Transaction
        //---------------------------------------------------

        await connection.beginTransaction();

        //---------------------------------------------------
        // 7. Create Order
        //---------------------------------------------------

        const [orderResult] = await connection.query(

            `INSERT INTO orders
            (
                order_number,
                user_id,
                total_amount,
                discount_amount,
                shipping_charge,
                net_amount,
                status
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?)`,
            [

                `ORD-${Date.now()}`, // Simple order number generation

                req.user.id,

                subtotal,

                0, // discount_amount

                shippingFee,

                total,

                "PENDING",

            ]

        );

        const orderId = orderResult.insertId;



        //---------------------------------------------------
        // 8. Order Items store DB
        //---------------------------------------------------

        for (const item of orderItems) {

            await connection.query(

                `INSERT INTO order_items
                (
                    order_id,
                    product_name,
                    product_id,
                    product_variant_id,
                    price,
                    quantity,
                    total_amount
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [

                    orderId,

                    item.product_name,

                    item.product_id,

                    item.product_variant_id,

                    item.price,

                    item.quantity,

                    item.total_amount

                ]

            );

        }


        //---------------------------------------------------
        // 9. Save shipping snapshot
        //---------------------------------------------------

        await connection.query(

            `INSERT INTO order_shipping_addresses
            (
                order_id,
                shipping_address_id,
                full_address,
                state,
                city,
                zip_code
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [

                orderId,

                shippingAddress.id,

                order_shipping_Address.full_address || shippingAddress.full_address,

                order_shipping_Address.state || shippingAddress.state,

                order_shipping_Address.city || shippingAddress.city,

                order_shipping_Address.zip || shippingAddress.zip_code

            ]

        );

        //---------------------------------------------------
        // Commit
        //---------------------------------------------------

        await connection.commit();


        //---------------------------------------------------
        // Return
        //---------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Order created successfully.",
            data: {
                orderId,
                orderStatus: "PENDING_PAYMENT",
                paymentStatus: "UNPAID",
                totalAmount: total
            }
        });


    } catch (error) {
        console.error(error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/**
 * @method POST /api/v1/buy-now
 * @description Directly order by clicking Buy Now button
 * @access Private (Authenticated User)
 */
const buyNowDirectly = async (req, res) => {
    let connection;

    try {


        const {
            products,
            full_address,
            state,
            city,
            zip
        } = req.body;

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Products are required."
            });
        }

        if (!full_address || !state || !city) {
            return res.status(400).json({
                success: false,
                message: "Full address, state and city are required."
            });
        }

        const token =
            req.cookies.refreshToken ||
            req.headers.authorization?.split(" ")[1];

        //---------------------------------------------------
        // Get DB Connection
        //---------------------------------------------------

        connection = await DB.promise().getConnection();

        //---------------------------------------------------
        // Validate Products
        //---------------------------------------------------

        const orderItems = [];

        for (const item of products) {

            const product = await getProductsByIds(
                item.product_id,
                token
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product_id} not found`
                });
            }

            if (product.stock_quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.product_name} has only ${product.stock_quantity} in stock`
                });
            }

            orderItems.push({
                product_id: product.id,
                product_variant_id: item.product_variant_id || null,
                product_name: product.product_name,
                product_image: product.product_image,
                price: product.price,
                quantity: item.quantity,
                total_amount: product.price * item.quantity
            });
        }

        //---------------------------------------------------
        // Calculate Amount
        //---------------------------------------------------

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.total_amount,
            0
        );

        const shippingState = state;
        const shippingFee =
            shippingState?.toLowerCase() === "dhaka" ? 60 : 120;

        const total = subtotal + shippingFee;

        //---------------------------------------------------
        // Begin Transaction
        //---------------------------------------------------

        await connection.beginTransaction();

        //---------------------------------------------------
        // Create Order
        //---------------------------------------------------

        const [orderResult] = await connection.query(
            `
            INSERT INTO orders
            (
                order_number,
                user_id,
                total_amount,
                discount_amount,
                shipping_charge,
                net_amount,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                `ORD-${Date.now()}`,
                req.user.id,
                subtotal,
                0,
                shippingFee,
                total,
                "PENDING"
            ]
        );

        const orderId = orderResult.insertId;

        //---------------------------------------------------
        // Save Order Items
        //---------------------------------------------------

        for (const item of orderItems) {

            await connection.query(
                `
                INSERT INTO order_items
                (
                    order_id,
                    product_name,
                    product_id,
                    product_variant_id,
                    price,
                    quantity,
                    total_amount
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    orderId,
                    item.product_name,
                    item.product_id,
                    item.product_variant_id,
                    item.price,
                    item.quantity,
                    item.total_amount
                ]
            );
        }

        //---------------------------------------------------
        // Save Shipping Snapshot
        //---------------------------------------------------

        await connection.query(
            `
            INSERT INTO order_shipping_addresses
            (
                order_id,
                full_address,
                state,
                city,
                zip_code
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                orderId,
                full_address,
                state,
                city,
                zip || null
            ]
        );

        //---------------------------------------------------
        // Commit
        //---------------------------------------------------

        await connection.commit();

        //---------------------------------------------------
        // Return
        //---------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Order created successfully.",
            data: {
                orderId,
                orderStatus: "PENDING",
                paymentStatus: "UNPAID",
                totalAmount: total
            }
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }
};


/**
 * @method GET /api/v1/:id
 * @description Directly order by clicking Buy Now button
 * @access Private (Authenticated User)
 */

const getOrdersByUserId = async (req, res) => {
    let connection;

    try {

        connection = await DB.promise().getConnection();

        //---------------------------------------------------
        // Get User Orders
        //---------------------------------------------------

        const [orders] = await connection.query(
            `
            SELECT
                id,
                order_number,
                total_amount,
                discount_amount,
                shipping_charge,
                net_amount,
                status,
                created_at,
                updated_at
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [req.user.id]
        );

        //---------------------------------------------------
        // No Orders
        //---------------------------------------------------

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No orders found.",
                data: []
            });
        }

        //---------------------------------------------------
        // Attach Items & Shipping Address
        //---------------------------------------------------

        const result = [];

        for (const order of orders) {

            //-----------------------------------------
            // Order Items
            //-----------------------------------------

            const [items] = await connection.query(
                `
                SELECT
                    id,
                    product_id,
                    product_variant_id,
                    product_name,
                    price,
                    quantity,
                    total_amount
                FROM order_items
                WHERE order_id = ?
                `,
                [order.id]
            );

            //-----------------------------------------
            // Shipping Address
            //-----------------------------------------

            const [shipping] = await connection.query(
                `
                SELECT
                    full_address,
                    state,
                    city,
                    zip_code
                FROM order_shipping_addresses
                WHERE order_id = ?
                LIMIT 1
                `,
                [order.id]
            );

            result.push({
                ...order,
                items,
                shipping_address: shipping[0] || null
            });
        }

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            totalOrders: result.length,
            data: result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }
};


/**
 * @method GET /api/v1/orders/:orderId
 * @description Get single order by order id
 * @access Private (Authenticated User)
 */
const getOrderById = async (req, res ) => {
    //TODO
}


/**
 * @method PATCH /api/v1/orders/:orderId/cancel
 * @description user can cancel order 
 * @access Private (Authenticated User)
 */



/**
 * @method PATCH /api/v1/orders/:orderId/status
 * @description (Pending, confirm, processing, shipped, delivered)
 * @access Private (Admin)
 * 
 */


/**
 * @method GET /api/v1/orders/admin
 * @description get all Orders
 * @access Private (Admin)
 */


/**
 * @method PATCH /api/v1/orders/admin/dashboard
 * @description Order Dashboard Statistics  (
 *  per year and per month{
    "totalOrders": 1250 date wise,
    "pendingOrders": 45,
    "processingOrders": 32,
    "shippedOrders": 18,
    "deliveredOrders": 1100,
    "cancelledOrders": 55,
    "totalRevenue": 1250000
}
 * )
 * @access Private (Admin)
 */

/**
 * @method GET /api/v1/orders/admin/:orderId
 * @description get single Order details ( Order information, Customer information, Order items, Shipping address, Payment status)
 * @access Private (Admin)
 */


/**
 * @method PATCH /api/v1/orders/:orderId/payment
 * @description Update payment status depending on payment
 * @access Private (Admin)
 */







export { createOrder, buyNowDirectly, getOrdersByUserId };