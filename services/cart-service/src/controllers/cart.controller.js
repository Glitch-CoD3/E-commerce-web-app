import DB from "../config/db.config.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

/**
 * @method POST /api/v1/cart
 * @description Add a product to the authenticated user's cart. If the product already exists, increase its quantity.
 * @access Private (Authenticated User)
 */

const addToCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        let {
            product_id,
            product_variant_id,
            quantity = 1
        } = req.body;

        const variantId = product_variant_id || null;

        quantity = Number(quantity);

        // ===========================
        // Validate Input
        // ===========================
        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required."
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1."
            });
        }

        // ===========================
        // Check Product
        // ===========================
        const [products] = await DB.promise().query(
            `SELECT id, status, stock_quantity
             FROM products
             WHERE id = ?
             AND deleted_at IS NULL`,
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        if (products[0].status !== "active") {
            return res.status(400).json({
                success: false,
                message: "This product is currently unavailable."
            });
        }

        // ===========================
        // Check Variant (Optional)
        // ===========================
        if (variantId) {

            const [variants] = await DB.promise().query(
                `SELECT id, product_id, stock_quantity
                 FROM product_variants
                 WHERE id = ?
                 AND deleted_at IS NULL`,
                [variantId]
            );

            if (variants.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product variant not found."
                });
            }

            if (variants[0].product_id != product_id) {
                return res.status(400).json({
                    success: false,
                    message: "Variant does not belong to the selected product."
                });
            }

            

            // Optional Stock Check
            /*
            if (variants[0].stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock."
                });
            }
            */
        }

        // ===========================
        // Check Existing Cart Item
        // ===========================
        const [cartItems] = await DB.promise().query(
            `SELECT id, quantity
             FROM carts
             WHERE user_id = ?
             AND product_id = ?
             AND (
                    (product_variant_id IS NULL AND ? IS NULL)
                    OR product_variant_id = ?
                 )`,
            [
                user_id,
                product_id,
                product_variant_id,
                product_variant_id
            ]
        );

        // ===========================
        // Update Existing Cart Item
        // ===========================
        if (cartItems.length > 0) {

            await DB.promise().query(
                `UPDATE carts
                 SET quantity = quantity + ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    quantity,
                    cartItems[0].id
                ]
            );

            const [updated] = await DB.promise().query(
                `SELECT *
                 FROM carts
                 WHERE id = ?`,
                [cartItems[0].id]
            );

            return res.status(200).json({
                success: true,
                message: "Cart updated successfully.",
                data: updated[0],
                links: {
                    self: `/api/v1/cart/${updated[0].id}`,
                    all_cart_items: "/api/v1/cart"
                }
            });
        }

        // ===========================
        // Insert New Cart Item
        // ===========================
        const [result] = await DB.promise().query(
            `INSERT INTO carts
            (
                user_id,
                product_id,
                product_variant_id,
                quantity
            )
            VALUES (?, ?, ?, ?)`,
            [
                user_id,
                product_id,
                product_variant_id,
                quantity
            ]
        );

        const [newItem] = await DB.promise().query(
            `SELECT *
             FROM carts
             WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Product added to cart successfully.",
            data: newItem[0],
            links: {
                self: `/api/v1/cart/${newItem[0].id}`,
                all_cart_items: "/api/v1/cart"
            }
        });

    } catch (error) {
        console.error("Add To Cart Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

/**
 * @method GET /api/v1/cart
 * @description Retrieve all cart items for the authenticated user.
 * @access Private (Authenticated User)
 */
const getCart = async (req, res) => {
     try {
        const user_id = req.user.id;

        const [cart] = await DB.promise().query(
            `SELECT
                id,
                product_id,
                product_variant_id,
                quantity,
                created_at,
                updated_at
             FROM carts
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            count: cart.length,
            data: cart,
            links: {
                add_to_cart: "/api/v1/cart",
                clear_cart: "/api/v1/cart"
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
 * @method GET /api/v1/cart/:id
 * @description Retrieve a specific cart item by its ID for the authenticated user.
 * @access Private (Authenticated User)
 */
const getCartItemById = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { id } = req.params;

        const [cart] = await DB.promise().query(
            `SELECT
                id,
                user_id,
                product_id,
                product_variant_id,
                quantity,
                created_at,
                updated_at
             FROM carts
             WHERE id = ?
             AND user_id = ?`,
            [id, user_id]
        );

        if (cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: cart[0],
            links: {
                self: `/api/v1/cart/${id}`,
                cart: "/api/v1/cart"
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
 * @method PATCH /api/v1/cart/:id
 * @description Update the quantity of a specific cart item.
 * @access Private (Authenticated User)
 */
const updateCartQuantity = async (req, res) => {
     try {
        const user_id = req.user.id;
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0."
            });
        }

        // Check if cart item exists and belongs to the user
        const [cart] = await DB.promise().query(
            `SELECT id
             FROM carts
             WHERE id = ?
             AND user_id = ?`,
            [id, user_id]
        );

        if (cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        await DB.promise().query(
            `UPDATE carts
             SET quantity = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [quantity, id]
        );

        const [updatedCart] = await DB.promise().query(
            `SELECT
                id,
                user_id,
                product_id,
                product_variant_id,
                quantity,
                created_at,
                updated_at
             FROM carts
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated successfully.",
            data: updatedCart[0],
            links: {
                self: `/api/v1/cart/${id}`,
                cart: "/api/v1/cart"
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
 * @method DELETE /api/v1/cart/:id
 * @description Remove a specific item from the authenticated user's cart.
 * @access Private (Authenticated User)
 */
const removeCartItem = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { id } = req.params;

        // Check if the cart item exists
        const [cart] = await DB.promise().query(
            `SELECT id
             FROM carts
             WHERE id = ?
             AND user_id = ?`,
            [id, user_id]
        );

        if (cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        await DB.promise().query(
            `DELETE FROM carts
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Cart item removed successfully.",
            links: {
                cart: "/api/v1/cart"
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
 * @method DELETE /api/v1/cart
 * @description Remove all items from the authenticated user's cart.
 * @access Private (Authenticated User)
 */
const clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [result] = await DB.promise().query(
            `DELETE FROM carts
             WHERE user_id = ?`,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully.",
            deleted_items: result.affectedRows,
            links: {
                cart: "/api/v1/cart"
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
    addToCart,
    getCart,
    getCartItemById,
    updateCartQuantity,
    removeCartItem,
    clearCart,
};