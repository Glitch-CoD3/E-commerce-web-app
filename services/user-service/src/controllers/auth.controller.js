import DB from "../config/db.config.js";
import { admin_role_id, user_role_id } from "../constants.js";
import { hashPassword, comparePassword, hashPhoneNumber, comparePhoneNumber } from "../utils/hashPassword.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone_number } = req.body;
        if(!name || !email || !password || !phone_number) {
            return res.status(400).json({ message: 'All fields are required to register a user' });
        }

        // Check if user exists
        const [response] = await DB.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (response.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);
        const phone_number_hash = await hashPhoneNumber(phone_number);

        // Insert user
        const [insertUser] = await DB.promise().query(
            'INSERT INTO users (full_name, email, password_hash, phone_number) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, phone_number_hash]
        );

        const [user] = await DB.promise().query(
            'SELECT * FROM users WHERE id = ?',
            [insertUser.insertId]
        );


        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user[0].id,
                full_name: user[0].full_name,
                email: user[0].email
            }
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error from registerUser'  });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required to login' });
        }

        const [response] = await DB.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );


        if (response.length === 0) {
            return res.status(400).json({ message: 'User not registered' });
        }

        const user = response[0];


        const isPasswordValid = await comparePassword(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        //generate JWT token here 


        //generate session here


        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error from loginUser' });
    }
};

export { registerUser, loginUser };