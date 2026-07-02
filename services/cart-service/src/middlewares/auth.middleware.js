import jwt from "jsonwebtoken";
import DB from "../config/db.config.js";

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [user] = await DB.promise().query(
            `SELECT id, role_id FROM users WHERE id = ?`,
            [decoded.id.id]
        );

        if (user.length === 0) {
            return res.status(401).json({
                message: "User not found!"
            });
        }


        req.user = {
            ...user[0],
            session_id: decoded.id.session_id
        };
        next();

    } catch (error) {
        console.error("Auth error", error);
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};