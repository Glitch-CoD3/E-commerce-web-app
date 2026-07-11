import { Router } from "express";
import proxy from 'express-http-proxy';

const router = Router();


router.use(
    proxy(process.env.PRODUCT_SERVICE_URI, {
        proxyReqPathResolver(req) {
            return "/api/v1/categories" + req.url;
        },
    })
);


export default router;