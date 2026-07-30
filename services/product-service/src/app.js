import express from 'express';
import cookieParser from 'cookie-parser';
import DB from './config/db.config.js';
import methodOverride from "method-override";
import morgan from 'morgan'



const app = express();



app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// Routes
import categoriesRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";
import productVariant from "./routes/product_variant.routes.js"
import brands from "./routes/brand.routes.js"
import productVariantImageRoutes from "./routes/productVariantImage.routes.js";


// API Routes
app.use("/api/v1/brands", brands);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/products", productRoutes);
app.use('/api/v1/product-variants', productVariant)
app.use('/api/v1/product-variants-images', productVariantImageRoutes)


// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Product Service is running."
    });
});


// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});




export default app;