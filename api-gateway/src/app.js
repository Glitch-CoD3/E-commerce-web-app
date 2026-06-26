import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import morgan from 'morgan'

//import middlewares
import limiter from './middleware/rateLimit.middleware.js';


const app = express();

//security middleware 
app.use(helmet());

//Rate limiting middleware
app.use('/api', limiter)

//request logger
app.use(morgan('dev'))

app.use(express.json())

//health check
app.use('/health', (req, res) => {
    res.json({
        message: "Api Gateway is running"
    })
})

app.use((error, _req, res, _next) => {
    console.error(error.stack)
    res.status(500).json({
        message: "Internal Server Error"
    })
})



export default app;