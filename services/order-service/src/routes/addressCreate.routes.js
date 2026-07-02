import express from 'express';
import { createShippingAddress, updateShippingAddress, getShippingAddress } from '../controllers/shipping_addresses.js';
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
 * @description Get a specific shipping address
 * @access Private
 */
router.get('/:id', verifyJWT, getShippingAddress);

/**
 * @PUT /api/v1/shipping-addresses/:id
 * @description Update an existing shipping address
 * @access Private
 */
router.put('/:id', verifyJWT, updateShippingAddress);

export default router;