import express from 'express';
import DB from './config/db.config.js';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));



export default app;