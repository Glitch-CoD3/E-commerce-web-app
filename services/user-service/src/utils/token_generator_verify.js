import jwt from 'jsonwebtoken';


const generate_refresh_token = (user_id, name, email, role_id) => {
    return jwt.sign({ id: user_id, name: name, email: email },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        });
};

const generate_access_token = (user_id, name, email, role_id) => {
    return jwt.sign({ id: user_id, name: name, email: email, role_id: role_id },
        process.env.JWT_SECRET,
        {
            expiresIn: '15m'
        });
};

export { generate_refresh_token, generate_access_token };