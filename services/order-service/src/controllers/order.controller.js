import DB from '../config/db.config.js'
import { getAllCart } from '../utils/axiosClient.js'
import { getProductsByIds, getProductByVariantId, getProductVarientImage } from '../utils/product.api.js'
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
        // console.log("Carts: ",carts)

        if (carts.data.length === 0) {
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
            // console.log("product:", product)

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
                    message: `${product.name} has only ${product.stock_quantity} items in stock`
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

            //Verify product varient available or not
            var varient = await getProductByVariantId(cartItem.product_variant_id, token);

            var varientImage = await getProductVarientImage(cartItem.product_variant_id, token);

            orderItems.push({
                product_id: product.id,
                product_variant_id: cartItem.product_variant_id,
                product_name: product.name,
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
                totalAmount: total,
                varient: {
                    color: varient.product_varient.colors,
                    size: varient.product_varient.sizes,
                    price: varient.product_varient.price,
                    image: varientImage[0].image_url
                },
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
    let transactionStarted = false;

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

        if (products.length > 20) {
            return res.status(400).json({
                success: false,
                message: "Too many items in a single order."
            });
        }

        for (const item of products) {
            if (!item.product_id || (typeof item.product_id !== "number" && typeof item.product_id !== "string")) {
                return res.status(400).json({
                    success: false,
                    message: "Each product requires a valid product_id."
                });
            }
            if (
                item.product_variant_id !== undefined &&
                item.product_variant_id !== null &&
                typeof item.product_variant_id !== "number" &&
                typeof item.product_variant_id !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product_variant_id."
                });
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for product ${item.product_id}.`
                });
            }
        }

        if (
            typeof full_address !== "string" || !full_address.trim() ||
            typeof state !== "string" || !state.trim() ||
            typeof city !== "string" || !city.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Full address, state and city are required."
            });
        }

        if (zip && !/^[A-Za-z0-9\- ]{3,12}$/.test(zip)) {
            return res.status(400).json({
                success: false,
                message: "Invalid zip code format."
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
        // Validate Products (and variants, where specified)
        //---------------------------------------------------

        const orderItems = [];

        for (const item of products) {

            const product = await getProductsByIds(
                item.product_id,
                token
            );
            // console.log("product:", product)

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product_id} not found`
                });
            }

            let variant = null;
            let variantImage = null;

            if (item.product_variant_id) {

                variant = await getProductByVariantId(
                    item.product_variant_id,
                    token
                );
                // console.log("varient:", variant)
                if (!variant) {
                    return res.status(404).json({
                        success: false,
                        message: `Variant ${item.product_variant_id} not found`
                    });
                }

                // Ensure the variant actually belongs to the requested product —
                // prevents a mismatched product_id/product_variant_id pair from
                // silently pricing/stocking against the wrong item.
                if (String(variant.product_varient.product_id) !== String(product.id)) {
                    return res.status(400).json({
                        success: false,
                        message: `Variant ${item.product_variant_id} does not belong to product ${item.product_id}`
                    });
                }

                // Exact image for this specific variant. A missing image
                // should not block checkout, so we fall back rather than
                // returning a 404 here.
                variantImage = await getProductVarientImage(
                    item.product_variant_id,
                    token
                );
            }

            // console.log("variant image:", variantImage)

            // Stock check — against the variant's own stock when a variant is
            // specified, otherwise the base product's stock.
            const availableStock = variant
                ? variant.stock_quantity
                : product.stock_quantity;

            if (availableStock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} has only ${availableStock} in stock`
                });
            }

            // Price — variant price overrides base product price when present.
            const unitPrice = variant?.price ?? product.price;

            // Image — the exact variant image when available, falling back to
            // the matching color image on the base product, then null.
            const productImage =
                variantImage ||
                (variant?.color && product.images?.[variant.color]) ||
                null;

            orderItems.push({
                product_id: product.id,
                product_variant_id: variant.product_varient.id,
                product_name: product.name,
                product_image: productImage,
                variant_size: variant?.size || null,
                variant_color: variant?.color || null,
                price: unitPrice,
                quantity: item.quantity,
                total_amount: unitPrice * item.quantity
            });
        }

        //---------------------------------------------------
        // Calculate Amount
        //---------------------------------------------------

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.total_amount,
            0
        );

        const shippingFee =
            state.toLowerCase() === "dhaka" ? 60 : 120;

        const total = subtotal + shippingFee;

        //---------------------------------------------------
        // Begin Transaction
        //---------------------------------------------------

        await connection.beginTransaction();
        transactionStarted = true;

        //---------------------------------------------------
        // Create Order
        //---------------------------------------------------

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
                orderNumber,
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
                full_address.trim(),
                state.trim(),
                city.trim(),
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
                orderNumber,
                orderStatus: "PENDING",
                paymentStatus: "UNPAID",
                totalAmount: total
            }
        });

    } catch (error) {

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        console.error("buyNowDirectly error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while placing your order. Please try again."
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

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        //---------------------------------------------------
        // Get User Orders (paginated)
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
                payment_status,
                created_at,
                updated_at
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            `,
            [req.user.id, limit, offset]
        );

        //---------------------------------------------------
        // No Orders
        //---------------------------------------------------

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No orders found.",
                pagination: { page, limit, totalCount: 0, totalPages: 0 },
                data: []
            });
        }

        const orderIds = orders.map(o => o.id);

        //---------------------------------------------------
        // Order Items (batched, not per-order)
        //---------------------------------------------------

        const [items] = await connection.query(
            `
            SELECT
                id,
                order_id,
                product_id,
                product_variant_id,
                product_name,
                price,
                quantity,
                total_amount
            FROM order_items
            WHERE order_id IN (?)
            `,
            [orderIds]
        );

        //---------------------------------------------------
        // Shipping Addresses (batched, not per-order)
        //---------------------------------------------------

        const [shippingAddresses] = await connection.query(
            `
            SELECT
                order_id,
                full_address,
                state,
                city,
                zip_code
            FROM order_shipping_addresses
            WHERE order_id IN (?)
            `,
            [orderIds]
        );

        //---------------------------------------------------
        // Merge in JS
        //---------------------------------------------------

        const result = orders.map(order => ({
            ...order,
            items: items.filter(item => item.order_id === order.id),
            shipping_address: shippingAddresses.find(s => s.order_id === order.id) || null
        }));

        //---------------------------------------------------
        // Total Count for Pagination
        //---------------------------------------------------

        const [[{ totalCount }]] = await connection.query(
            `SELECT COUNT(*) AS totalCount FROM orders WHERE user_id = ?`,
            [req.user.id]
        );

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
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
        const [order_details] = await DB.promise().query(
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
        const [itemsResult] = await DB.promise().query(
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


        if (itemsResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Items not found!"
            });
        }

        //---------------------------------------------------
        // Get Shipping Address
        //---------------------------------------------------
        const [shippingResult] = await DB.promise().query(
            `
            SELECT
                full_address,
                state,
                city,
                zip_code
            FROM order_shipping_addresses
            WHERE order_id = ?
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
                Order_items: itemsResult,
                shipping_address: shippingResult[0] || null
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
                payment_status,
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

        console.log(orders[0])

        if (orders.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order not fetched"
            });
        }
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
 * @method GET /api/v1/orders/admin/dashboard
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
        // 1. Input Validation
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();
        const month = req.query.month ? parseInt(req.query.month, 10) : null;

        if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
            return res.status(400).json({
                success: false,
                message: "Invalid month parameter. Must be an integer between 1 and 12."
            });
        }

        // 2. Index-Friendly Date Range Construction
        let startDate, endDate;
        if (month) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 1);
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year + 1, 0, 1);
        }

        // 3. Optimized Aggregation Query
        const [rows] = await connection.query(
            `
            SELECT
                COUNT(*) AS totalOrders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedOrders,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processingOrders,
                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shippedOrders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS totalPaidOrders,
                COALESCE(
                    SUM(
                        CASE 
                            WHEN payment_status = 'paid' AND status <> 'cancelled' 
                            THEN total_amount 
                            ELSE 0 
                        END
                    ), 0
                ) AS totalRevenue
            FROM orders
            WHERE created_at >= ? AND created_at < ?
            `,
            [startDate, endDate]
        );

        const rawData = rows[0];

        // 4. Metric Calculations
        const totalOrders = Number(rawData.totalOrders || 0);
        const pendingOrders = Number(rawData.pendingOrders || 0);
        const confirmedOrders = Number(rawData.confirmedOrders || 0);
        const processingOrders = Number(rawData.processingOrders || 0);
        const shippedOrders = Number(rawData.shippedOrders || 0);
        const deliveredOrders = Number(rawData.deliveredOrders || 0);
        const cancelledOrders = Number(rawData.cancelledOrders || 0);
        const totalPaidOrders = Number(rawData.totalPaidOrders || 0);
        const totalRevenue = Number(rawData.totalRevenue || 0);

        const averageOrderValue = totalPaidOrders > 0
            ? Number((totalRevenue / totalPaidOrders).toFixed(2))
            : 0;

        const completionRatePercentage = totalOrders > 0
            ? Number(((deliveredOrders / totalOrders) * 100).toFixed(2))
            : 0;

        const cancellationRatePercentage = totalOrders > 0
            ? Number(((cancelledOrders / totalOrders) * 100).toFixed(2))
            : 0;

        const actionableOrdersCount = pendingOrders + confirmedOrders + processingOrders;

        // 5. Response Payload
        return res.status(200).json({
            success: true,
            filter: {
                year,
                month,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            statistics: {
                overview: {
                    totalRevenue,
                    averageOrderValue,
                    actionableOrdersCount
                },
                orderCounts: {
                    total: totalOrders,
                    pending: pendingOrders,
                    confirmed: confirmedOrders,
                    processing: processingOrders,
                    shipped: shippedOrders,
                    delivered: deliveredOrders,
                    cancelled: cancelledOrders
                },
                rates: {
                    completionRatePercentage,
                    cancellationRatePercentage
                }
            }
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
        let { payment_status } = req.body; // Use 'let' so it can be transformed

        //---------------------------------------------------
        // Validation
        //---------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        if (!payment_status || typeof payment_status !== "string") {
            return res.status(400).json({
                success: false,
                message: "Payment status string is required"
            });
        }

        // Convert to uppercase safely
        payment_status = payment_status.toUpperCase();

        // Standardized all allowed values to UPPERCASE
        const allowedPaymentStatus = [
            "PENDING",
            "PAID",
            "UNPAID",
            "REFUNDED"
        ];

        if (!allowedPaymentStatus.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status. Allowed: PENDING, PAID, UNPAID, REFUNDED"
            });
        }

        //---------------------------------------------------
        // Check Order
        //---------------------------------------------------

        const [orders] = await connection.query(
            `
            SELECT id, payment_status
            FROM orders
            WHERE id = ? AND status <> 'cancelled'
            `,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or order has been cancelled"
            });
        }

        // Handle DB comparison safely (case-insensitive check against existing record)
        const currentDbStatus = orders[0].payment_status
            ? orders[0].payment_status.toUpperCase()
            : "";

        if (currentDbStatus === payment_status) {
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

/**
 * @method GET /api/v1/orders/admin/analytics/top-selling-products
 * @description Get top selling products by sales volume and revenue
 * @access Private (Admin)
 */
const getTopSellingProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const categoryId = req.query.categoryId || null; // Optional category filter
        // const vendorId = req.query.vendorId || null; // BLOCKED: products table has no vendor_id — confirm source

        let filterWhere = "";
        const filterValues = [];

        if (categoryId) {
            filterWhere = "WHERE p.category_id = ?";
            filterValues.push(categoryId);
        }

        const values = [...filterValues, limit];

        const [products] = await connection.query(
            `
            SELECT 
                p.id AS productId,
                p.product_name AS productName,
                p.price AS basePrice,
                p.stock_quantity AS currentStock,
                p.status AS productStatus,
                c.category_name AS categoryName,
                oi.product_variant_id AS variantId,
                pv.colors AS variantColor,
                pv.sizes AS variantSize,
                CONCAT_WS(' / ', pv.colors, pv.sizes) AS variantLabel,
                pv.stock_quantity AS variantStock,
                COUNT(DISTINCT oi.order_id) AS totalOrders,
                SUM(oi.quantity) AS totalUnitsSold,
                COALESCE(SUM(oi.total_amount), 0) AS totalRevenueGenerated,
                ROUND(AVG(oi.quantity), 2) AS avgUnitsPerOrder,
                ROUND(COALESCE(SUM(oi.total_amount), 0) / NULLIF(SUM(oi.quantity), 0), 2) AS avgSellingPrice,
                ROUND(
                    COALESCE(SUM(oi.total_amount), 0) * 100.0 /
                    NULLIF((
                        SELECT SUM(oi2.total_amount)
                        FROM order_items oi2
                        JOIN orders o2 ON oi2.order_id = o2.id
                        WHERE UPPER(o2.payment_status) = 'PAID'
                        AND LOWER(o2.status) <> 'cancelled'
                    ), 0),
                2) AS revenueSharePercent
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
            LEFT JOIN categories c ON p.category_id = c.id
            ${filterWhere}
            ${filterWhere ? "AND" : "WHERE"} UPPER(o.payment_status) = 'PAID'
            AND LOWER(o.status) <> 'cancelled'
            AND p.deleted_at IS NULL
            GROUP BY 
                p.id, p.product_name, p.price, p.stock_quantity, p.status,
                c.category_name, oi.product_variant_id, pv.colors, pv.sizes, pv.stock_quantity
            ORDER BY totalUnitsSold DESC
            LIMIT ?
            `,
            values
        );

        const rankedProducts = products.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        return res.status(200).json({
            success: true,
            message: "Top Selling Products (with variant breakdown)",
            count: rankedProducts.length,
            data: rankedProducts
        });
    } catch (error) {
        console.error("Top Selling Products Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @method GET /api/v1/orders/admin/analytics/sales-trend
 * @description Get sales and revenue trends over time (monthly/daily)
 * @access Private (Admin)
 */

const getSalesTrendOverTime = async (req, res) => {
    try {
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();
        const groupBy = req.query.groupBy || 'month'; // 'month' or 'day'

        let dateGroupSql = "DATE_FORMAT(created_at, '%Y-%m')"; // Default: monthly chart
        if (groupBy === 'day') {
            dateGroupSql = "DATE_FORMAT(created_at, '%Y-%m-%d')";
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const [trends] = await connection.query(
            `
            SELECT 
                ${dateGroupSql} AS period,
                COUNT(id) AS totalOrders,
                COALESCE(
                    SUM(CASE WHEN LOWER(payment_status) = 'paid' AND LOWER(status) <> 'cancelled' THEN total_amount ELSE 0 END), 
                    0
                ) AS revenue
            FROM orders
            WHERE created_at >= ? AND created_at < ?
            GROUP BY period
            ORDER BY period ASC
            `,
            [startDate, endDate]
        );

        return res.status(200).json({
            success: true,
            year,
            groupBy,
            trends
        });
    } catch (error) {
        console.error("Sales Trend Analytics Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @method GET /api/v1/orders/admin/analytics/inventory-alerts
 * @description Get low stock and out-of-stock product warnings
 * @access Private (Admin)
 */
const getInventoryAlerts = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold, 10) || 10; // Default: low stock <= 10 items
        const vendorId = req.user?.vendorId || req.query.vendorId;

        let whereClause = "WHERE stock_quantity <= ?";
        const values = [threshold];

        if (vendorId) {
            whereClause += " AND vendor_id = ?";
            values.push(vendorId);
        }

        const [lowStockItems] = await connection.query(
            `
            SELECT 
                id AS productId,
                product_name AS productName,
                stock_quantity,
                price,
                CASE 
                    WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
                    ELSE 'LOW_STOCK'
                END AS stockStatus
            FROM products
            ${whereClause}
            ORDER BY stock_quantity ASC
            `,
            values
        );

        return res.status(200).json({
            success: true,
            threshold,
            count: lowStockItems.length,
            items: lowStockItems
        });
    } catch (error) {
        console.error("Inventory Alerts Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @method GET /api/v1/orders/admin/analytics/customer-metrics
 * @description Get customer lifetime value and repeat purchase analytics
 * @access Private (Admin)
 */
const getCustomerAnalytics = async (req, res) => {
    try {
        const [customerMetrics] = await connection.query(`
            SELECT 
                COUNT(DISTINCT u.id) AS totalCustomers,
                COUNT(DISTINCT CASE WHEN order_counts.total_orders > 1 THEN u.id END) AS repeatCustomers,
                COUNT(DISTINCT CASE WHEN order_counts.total_orders = 1 THEN u.id END) AS singlePurchaseCustomers,
                COALESCE(AVG(order_counts.customer_total_spend), 0) AS averageCustomerLifetimeValue
            FROM users u
            LEFT JOIN (
                SELECT 
                    user_id, 
                    COUNT(id) AS total_orders,
                    SUM(
                        CASE 
                            WHEN LOWER(payment_status) = 'paid' AND LOWER(status) <> 'cancelled' 
                            THEN total_amount 
                            ELSE 0 
                        END
                    ) AS customer_total_spend
                FROM orders
                GROUP BY user_id
            ) order_counts ON u.id = order_counts.user_id
            WHERE u.role_id = 2
        `);

        const data = customerMetrics[0];

        const totalCust = Number(data.totalCustomers) || 0;
        const repeatCust = Number(data.repeatCustomers) || 0;
        const repeatPurchaseRate = totalCust > 0
            ? parseFloat(((repeatCust / totalCust) * 100).toFixed(2))
            : 0;

        return res.status(200).json({
            success: true,
            analytics: {
                totalCustomers: totalCust,
                repeatCustomers: repeatCust,
                singlePurchaseCustomers: Number(data.singlePurchaseCustomers) || 0,
                repeatPurchaseRatePercentage: repeatPurchaseRate,
                averageCustomerLifetimeValue: parseFloat(Number(data.averageCustomerLifetimeValue).toFixed(2))
            }
        });
    } catch (error) {
        console.error("Customer Analytics Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


/**
 * @method GET /api/v1/orders/admin/analytics/customer-metrics/paid-customers
 * @description Get customer lifetime value and repeat purchase analytics
 * @access Private (Admin)
 */
const getAllPaidCustomers = async (req, res) => {
    let connection;

    try {
        connection = await DB.promise().getConnection();

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        //---------------------------------------------------
        // Get Paid Customers (latest paid order + totals)
        //---------------------------------------------------

        const [customers] = await connection.query(
            `
            WITH paid_orders AS (
                SELECT 
                    o.id,
                    o.user_id,
                    o.net_amount,
                    o.created_at,
                    ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.created_at DESC) AS rn
                FROM orders o
                WHERE UPPER(o.payment_status) = 'PAID'
            ),
            customer_totals AS (
                SELECT 
                    user_id,
                    COUNT(*) AS totalPaidOrders,
                    SUM(net_amount) AS totalPaid
                FROM orders
                WHERE UPPER(payment_status) = 'PAID'
                GROUP BY user_id
            )
            SELECT
                u.id AS customerId,
                u.full_name AS customerName,
                u.email AS emailAddress,
                u.phone_number AS mobileNumber,
                osa.full_address AS shippingAddress,
                osa.city AS shippingCity,
                osa.state AS shippingState,
                osa.zip_code AS shippingZipCode,
                po.created_at AS lastOrderDate,
                ct.totalPaidOrders,
                ct.totalPaid
            FROM paid_orders po
            JOIN users u ON u.id = po.user_id
            JOIN customer_totals ct ON ct.user_id = po.user_id
            LEFT JOIN order_shipping_addresses osa ON osa.order_id = po.id
            WHERE po.rn = 1
            ORDER BY po.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [limit, offset]
        );

        //---------------------------------------------------
        // Total Count (distinct paid customers)
        //---------------------------------------------------

        const [[{ totalCount }]] = await connection.query(
            `
            SELECT COUNT(DISTINCT user_id) AS totalCount
            FROM orders
            WHERE UPPER(payment_status) = 'PAID'
            `
        );

        return res.status(200).json({
            success: true,
            message: "Paid customers retrieved successfully.",
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            data: customers
        });

    } catch (error) {
        console.error("Get All Paid Customers Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        if (connection) {
            connection.release();
        }
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
    updatePaymentStatus,
    getTopSellingProducts,
    getSalesTrendOverTime,
    getInventoryAlerts,
    getCustomerAnalytics,
    getAllPaidCustomers,
};