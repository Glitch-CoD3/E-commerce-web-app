import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = express.Router()

import { createOrder, buyNowDirectly, getOrdersByUserId } from '../controllers/order.controller.js'


router.post('/', verifyJWT, createOrder)
router.get('/', verifyJWT, getOrdersByUserId)
router.post('/buy-now',verifyJWT, buyNowDirectly)


export default router;