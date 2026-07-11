import app from './app.js';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });


const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || "Api Gateway";
const SERVICE_URI = process.env.SERVICE_URI || "http://localhost:3000";

app.listen(PORT, () => {
    console.log(`✅ ${SERVICE_NAME} is running on port ${PORT}`);
    console.log(`⛔ ${SERVICE_URI}`);
});

