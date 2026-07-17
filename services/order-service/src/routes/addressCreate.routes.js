import express from 'express';
import { createShippingAddress, updateShippingAddress, getShippingAddress, getShippingAddressById } from '../controllers/shipping_addresses.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @POST /api/v1/shipping-addresses
 * @description Create a new shipping address
 * @access Private
 */
router.post('/', verifyJWT, createShippingAddress);


/**
 * @GET /api/v1/shipping-addresses/:id
 * @description Get a user's shipping address
 * @access Private
 */
router.get('/user/:id', verifyJWT, getShippingAddress);

/**
 * @GET /api/v1/shipping-addresses/:id
 * @description Get a specific shipping address
 * @access Private
 */
router.get('/:id', verifyJWT, getShippingAddressById);

/**
 * @PUT /api/v1/shipping-addresses/:id
 * @description Update an existing shipping address
 * @access Private
 */
router.put('/:id', verifyJWT, updateShippingAddress);

export default router;