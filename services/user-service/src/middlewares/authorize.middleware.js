const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role_id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden"
            });
        }

        next();
    };
};

export {
    allowRoles
}