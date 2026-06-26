import cron from "node-cron";
import DB from "../config/db.config.js";

const startOtpCleanup = () => {
    // Runs every 15 days
    cron.schedule("0 0 */15 * *", async () => {
        try {
            const [result] = await DB.promise().query(
                `DELETE FROM otps
                 WHERE expires_at <= NOW()`
            );

            if (result.affectedRows > 0) {
                console.log(
                    `[OTP Cleanup] Deleted ${result.affectedRows} expired OTP(s)`
                );
            }
        } catch (error) {
            console.error("[OTP Cleanup Error]", error);
        }
    });

    console.log("OTP cleanup scheduler started.");
};

export default startOtpCleanup;