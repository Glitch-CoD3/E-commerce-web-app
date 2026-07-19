import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

// Middlewares
import limiter from './middleware/rateLimit.middleware.js';
import { verifyJWT, authorizeRole } from './middleware/auth.middleware.js';

// Routes (Proxy)
import userProxy from './routes/user.proxy.js';

import productProxy from './routes/product-service-proxy/product.proxy.js';
import categoryProxy from './routes/product-service-proxy/categories.proxy.js';
import productVariantProxy from './routes/product-service-proxy/product_variant.proxy.js';


import orderProxy from './routes/order_service-proxy/order.proxy.js';
import cartProxy from './routes/cart.proxy.js';
import shipping_address_proxy from './routes/order_service-proxy/Shipping_address.proxy.js'

const app = express();

/* ---------------- Security ---------------- */

app.use(helmet());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

/* ---------------- Rate Limit ---------------- */

app.use('/api', limiter);

/* ---------------- Logger ---------------- */

app.use(morgan('dev'));

/* ---------------- Parsers ---------------- */

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/* ---------------- Health Check ---------------- */

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Gateway is running"
    });
});

/* ---------------- Public Routes ---------------- */



app.use("/api/v1/auth", userProxy);

/* ---------------- Protected Routes ---------------- */

app.use("/api/v1/products", verifyJWT, productProxy);

app.use("/api/v1/categories", verifyJWT, categoryProxy);

app.use("/api/v1/product-variants", verifyJWT, productVariantProxy);

app.use('/api/v1/cart', verifyJWT, cartProxy);

app.use('/api/v1/order', verifyJWT, orderProxy);

app.use('/api/v1/order/address', verifyJWT, shipping_address_proxy);


/* ---------------- 404 ---------------- */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

/* ---------------- Error Handler ---------------- */

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

export default app;