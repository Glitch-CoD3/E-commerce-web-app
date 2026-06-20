import app from './app.js';
import dotenv from 'dotenv';
import DB from './config/db.config.js';
dotenv.config({ quiet: true });


DB.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application if the database connection fails
    } else {
        console.log(`✅ Database connected successfully with ${process.env.DB_NAME} database`);
        connection.release();


        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`✅ User service is running on port ${PORT}`);
            console.log("\n🌍 http://localhost:" + PORT + "/");
        });
    }
});

