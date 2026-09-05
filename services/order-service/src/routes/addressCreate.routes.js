import express from 'express';
import { createShippingAddress, updateShippingAddress, getShippingAddress, getShippingAddressById, deleteShippingAddress } from '../controllers/shipping_addresses.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// =======================
// Authenticated User Routes
// =======================
router.use(verifyJWT);

/**
 * @POST /api/v1/shipping-addresses
 * @description Create a new shipping address
 * @access Private
 */
router.post('/', createShippingAddress);


/**
 * @GET /api/v1/order/address/:id
 * @description Get a user's shipping address
 * @access Private
 */
router.get('/user/:id', getShippingAddress);

/**
 * @GET /api/v1/order/address/:id
 * @description Get a specific shipping address
 * @access Private
 */
router.get('/:id', getShippingAddressById);

/**
 * @PUT /api/v1/shipping-addresses/:id
 * @description Update an existing shipping address
 * @access Private
 */
router.patch('/:id', updateShippingAddress);

/**
 * @DELETE /api/v1/shipping-addresses/:id
 * @description Delete a shipping address
 * @access Private
 */
router.delete('/:id', deleteShippingAddress);

export default router;