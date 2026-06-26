import express from 'express';
import cookieParser from 'cookie-parser';
import DB from './config/db.config.js';


const app = express();



app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));






export default app;