import { Router } from "express";
import proxy from 'express-http-proxy';

const router = Router();

router.use(
    proxy(process.env.PRODUCT_SERVICE_URI, {
        proxyReqPathResolver(req) {
            return "/api/v1/product-variants" + req.url;
        },
    })
);

export default router;