import express from 'express';
import cookieParser from 'cookie-parser';
import DB from './config/db.config.js';


const app = express();



app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


// Routes
import orderRoutes from "./routes/order.routes.js";
import addressCreateRoutes from "./routes/addressCreate.routes.js";

// API Routes
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/order/address", addressCreateRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Order Service is running."
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