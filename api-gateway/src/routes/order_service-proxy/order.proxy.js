import { Router } from "express";
import proxy from 'express-http-proxy';

const router = Router();



router.use(
    proxy(process.env.ORDER_SERVICE_URI, {
        proxyReqPathResolver(req) {
            return "/api/v1/order" + req.url;
        },
    })
);

export default router;