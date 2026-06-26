import app from './app.js';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });


const PORT = process.env.PORT || 8001;
const SERVICE_NAME = process.env.SERVICE_NAME || "Product-Service";
const USER_SERVICE_URI = process.env.USER_SERVICE_URI || "http://localhost:8001";

app.listen(PORT, () => {
    console.log(`✅ ${SERVICE_NAME} is running on port ${PORT}`);
    console.log(`⛔ ${USER_SERVICE_URI}`);
});

