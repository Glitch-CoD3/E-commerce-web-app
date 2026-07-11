import { Router } from 'express';
import proxy from 'express-http-proxy'


const router = Router()

router.use(
    proxy(process.env.CART_SERVICE_URI, {
        proxyReqPathResolver(req) {
            return "/api/v1/cart" + req.url;
        }
    })


)


export default router;