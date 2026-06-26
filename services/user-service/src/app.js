import express from 'express';
import cookieParser from 'cookie-parser';
import DB from './config/db.config.js';
import authRoutes from './routes/auth.routes.js';
import startOtpCleanup from './utils/Otp_cleanup.js';

const app = express();

// Start scheduler
startOtpCleanup();

app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


app.use('/api/v1/auth', authRoutes);



export default app;