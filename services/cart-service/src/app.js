import express from 'express';
import cookieParser from 'cookie-parser';
import DB from './config/db.config.js';


const app = express();



app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


// Routes
import cartRoutes from "./routes/cart.routes.js";

// API Routes
app.use("/api/v1/cart", cartRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Cart Service is running."
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