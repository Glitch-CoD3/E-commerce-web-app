import DB from '../config/db.config.js'
import { getAllCart } from '../utils/axiosClient.js'
import { getProductsByIds } from '../utils/product.api.js'
import { getShippingAddressByUserId } from '../utils/getShippingAddress.api.js'
const connection = await DB.promise().getConnection();
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

const getOrderByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        //---------------------------------------------------
        // Get Order
        //---------------------------------------------------
        const [order_details] = await connection.query(
            `
            SELECT *
            FROM orders
            WHERE id = ?
            `,
            [orderId]
        );


        if (order_details.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        //---------------------------------------------------
        // Get Order Items
        //---------------------------------------------------
        const [itemsResult] = await connection.query(
            `
            SELECT
                id,
                product_name,
                product_id,
                product_variant_id,
                price,
                quantity,
                total_amount
            FROM order_items
            WHERE order_id = ?
            ORDER BY id ASC
            `,
            [orderId]
        );

        //---------------------------------------------------
        // Response
        //---------------------------------------------------
        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order_result: {
                order_details,
                Order_items: itemsResult
            }
        });

    } catch (error) {
        console.error("Get Order By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @method PATCH /api/v1/order/:orderId/cancel
 * @description user can cancel order 
 * @access Private (Authenticated User)
 */

const order_cancel = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        //---------------------------------------------------
        // Check Order
        //---------------------------------------------------

        const [orderResult] = await connection.query(
            `
            SELECT *
            FROM orders
            WHERE id = ?
              AND user_id = ?
            `,
            [orderId, userId]
        );

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orderResult[0];
        console.log(order.status)

        //---------------------------------------------------
        // Check Current Status
        //---------------------------------------------------

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled"
            });
        }

        if (
            ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${order.status} order`
            });
        }

        //---------------------------------------------------
        // Cancel Order
        //---------------------------------------------------

        const [updatedOrder] = await connection.query(
            `
            UPDATE orders
            SET
                status = 'cancelled',
                updated_at = NOW()
            WHERE id = ?
            `,
            [orderId]
        );

        //---------------------------------------------------
        // Restore Stock (Optional)
        //---------------------------------------------------


        // const items = await connection.query(
        //     `
        //     SELECT product_id, product_variant_id, quantity
        //     FROM order_items
        //     WHERE order_id = ?
        //     `,
        //     [orderId]
        // );

        // await restoreProductStock(items);


        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            orderId
        });

    } catch (error) {
        console.error("Order Cancel Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



/**
 * @method PATCH /api/v1/orders/:orderId/status
 * @description (Pending, confirm, processing, shipped, delivered)
 * @access Private (Admin)
 * 
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        //---------------------------------------------------
        // Check Order
        //---------------------------------------------------

        const [orderResult] = await connection.query(
            `
            SELECT *
            FROM orders
            WHERE id = ?
             AND status <> "cancelled"
            `,
            [orderId]
        );

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orderResult;

        console.log(order)

        //---------------------------------------------------
        // update Order status
        //---------------------------------------------------

        const [updatedOrder] = await connection.query(
            `
            UPDATE orders
            SET
            status = ?,
            updated_at = NOW()
            WHERE id = ?
            `,
            [status, orderId]
        );


        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: `Your order is ${status}`,
            orderId
        });

    } catch (error) {
        console.error("Order status update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @method GET /api/v1/orders/admin
 * @description get all Orders
 * @access Private (Admin)
 */

const getAllOrders = async (req, res) => {
    try {
        //---------------------------------------------------
        // Query Parameters
        //---------------------------------------------------

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const status = req.query.status || "";
        const search = req.query.search || "";

        //---------------------------------------------------
        // Build Query
        //---------------------------------------------------

        let whereClause = "WHERE 1=1";
        const values = [];

        if (status) {
            whereClause += " AND status = ?";
            values.push(status);
        }

        if (search) {
            whereClause += " AND id LIKE ?";
            values.push(`%${search}%`);
        }

        //---------------------------------------------------
        // Total Orders
        //---------------------------------------------------
        const [countResult] = await connection.query(
            `
            SELECT COUNT(*) AS total
            FROM orders
            ${whereClause}
            `,
            values
        );

        const totalOrders = countResult[0].total;

        //---------------------------------------------------
        // Get Orders
        //---------------------------------------------------

        const [orders] = await connection.query(
            `
            SELECT
                id,
                user_id,
                total_amount,
                discount_amount,
                shipping_charge,
                net_amount,
                status,
                created_at,
                updated_at
            FROM orders
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ?
            OFFSET ?
            `,
            [...values, limit, offset]
        );

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            orders
        });

    } catch (error) {
        console.error("Get All Orders Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


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

const orderDashboardStatistics = async (req, res) => {
    try {

        //---------------------------------------------------
        // Query Params
        //---------------------------------------------------

        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = req.query.month ? parseInt(req.query.month) : null;

        //---------------------------------------------------
        // Build WHERE Clause
        //---------------------------------------------------

        let whereClause = `WHERE YEAR(created_at) = ?`;
        const values = [year];

        if (month) {
            whereClause += ` AND MONTH(created_at) = ?`;
            values.push(month);
        }

        //---------------------------------------------------
        // Get Dashboard Statistics
        //---------------------------------------------------

        const [result] = await connection.query(
            `
            SELECT
                COUNT(*) AS totalOrders,

                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,

                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedOrders,

                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processingOrders,

                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shippedOrders,

                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,

                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_status = 'paid'
                            AND status <> 'cancelled'
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS totalRevenue

            FROM orders
            ${whereClause}
            `,
            values
        );

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            period: {
                year,
                month
            },
            statistics: result[0]
        });

    } catch (error) {

        console.error("Dashboard Statistics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
};


/**
 * @method GET /api/v1/orders/admin/:orderId
 * @description Get single order details
 * @access Private (Admin)
 */

const getOrderDetailsByOrderId = async (req, res) => {
    try {

        const { orderId } = req.params;

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        //---------------------------------------------------
        // Get Order
        //---------------------------------------------------

        const [orders] = await connection.query(
            `
            SELECT *
            FROM orders
            WHERE id = ?
            `,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        //---------------------------------------------------
        // Get Order Items
        //---------------------------------------------------

        const [items] = await connection.query(
            `
            SELECT
                product_id,
                product_variant_id,
                product_name,
                quantity,
                price,
                total_amount
            FROM order_items
            WHERE order_id = ?
            `,
            [orderId]
        );

        //---------------------------------------------------
        // Get Shipping Address
        //---------------------------------------------------

        const [shippingAddress] = await connection.query(
            `
            SELECT
                order_id,
                full_address,
                phone_number,
                state,
                city,
                zip_code
            FROM order_shipping_addresses
            WHERE order_id = ?
            `,
            [orderId]
        );

        //---------------------------------------------------
        // Get Customer Information
        // (Call User Service)
        //---------------------------------------------------

        // const customer = await getUserById(order.user_id);

        const customer = {
            id: order.user_id
        };

        //---------------------------------------------------
        // Payment Information
        //---------------------------------------------------

        const payment = {
            payment_method: order.payment_method,
            payment_status: order.payment_status || "Pending"
        };

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            data: {
                order,
                customer,
                items,
                shippingAddress: shippingAddress[0] || null,
                payment
            }
        });

    } catch (error) {

        console.error("Get Order Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
};



/**
 * @method PATCH /api/v1/orders/:orderId/payment
 * @description Update payment status
 * @access Private (Admin)
 */

const updatePaymentStatus = async (req, res) => {
    try {

        const { orderId } = req.params;
        const { payment_status } = req.body;

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        const allowedPaymentStatus = [
            "pending",
            "PAID",
            "UNPAID",
            "refunded"
        ];

        if (!allowedPaymentStatus.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status"
            });
        }

        //---------------------------------------------------
        // Check Order
        //---------------------------------------------------

        const [orders] = await connection.query(
            `
            SELECT id, payment_status
            FROM orders
            WHERE id = ?
            `,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        //---------------------------------------------------
        // Already Updated
        //---------------------------------------------------

        if (orders[0].payment_status === payment_status) {
            return res.status(400).json({
                success: false,
                message: `Payment is already ${payment_status}`
            });
        }

        //---------------------------------------------------
        // Update Payment Status
        //---------------------------------------------------

        const [result] = await connection.query(
            `
            UPDATE orders
            SET
                payment_status = ?,
                updated_at = NOW()
            WHERE id = ?
            `,
            [payment_status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Failed to update payment status"
            });
        }

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: `Payment status updated to ${payment_status}`
        });

    } catch (error) {

        console.error("Update Payment Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
};



export {
    createOrder,
    buyNowDirectly,
    getOrdersByUserId,
    getOrderByOrderId,
    order_cancel,
    updateOrderStatus,
    getAllOrders,
    orderDashboardStatistics,
    getOrderDetailsByOrderId,
    updatePaymentStatus
};