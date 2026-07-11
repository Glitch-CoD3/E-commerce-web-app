import jwt from "jsonwebtoken";

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            user: decoded
        };

        next();

    } catch (error) {
        console.error("Auth error", error);
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

export default verifyJWT;