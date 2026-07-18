import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = express.Router()

import { createOrder, 
    buyNowDirectly, 
    getOrdersByUserId,
    getOrderByOrderId,
    order_cancel,
    updateOrderStatus,
    getAllOrders,
    orderDashboardStatistics,
    getOrderDetailsByOrderId,
    updatePaymentStatus
    
} from '../controllers/order.controller.js'


router.post('/', verifyJWT, createOrder)
router.get('/admin', getAllOrders)   //admin access
router.get('/admin/dashboard', orderDashboardStatistics)   //admin access
router.get('/admin/:orderId', getOrderDetailsByOrderId)   //admin access
router.patch('/admin/:orderId/update_payment_status', updatePaymentStatus)   //admin access
router.get('/', verifyJWT, getOrdersByUserId)
router.post('/buy-now',verifyJWT, buyNowDirectly)
router.get('/:orderId', getOrderByOrderId)   //user access
router.patch('/:orderId/cancel',verifyJWT, order_cancel)
router.patch('/:orderId/status', updateOrderStatus)  //admin access depends on payment and shipping




export default router;