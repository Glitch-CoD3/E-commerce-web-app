import express from 'express';
import DB from './config/db.config.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/v1/auth', authRoutes);



export default app;