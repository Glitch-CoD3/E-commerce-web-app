import express from 'express';
import { createShippingAddress, updateShippingAddress, getShippingAddress, getShippingAddressById } from '../controllers/shipping_addresses.js';
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
 * @GET /api/v1/shipping-addresses/:id
 * @description Get a user's shipping address
 * @access Private
 */
router.get('/user/:id', getShippingAddress);

/**
 * @GET /api/v1/shipping-addresses/:id
 * @description Get a specific shipping address
 * @access Private
 */
router.get('/:id', getShippingAddressById);

/**
 * @PUT /api/v1/shipping-addresses/:id
 * @description Update an existing shipping address
 * @access Private
 */
router.put('/:id', updateShippingAddress);

export default router;