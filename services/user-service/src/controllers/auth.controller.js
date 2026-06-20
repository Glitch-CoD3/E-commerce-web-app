import DB from "../config/db.config.js";
import bcrypt from 'bcrypt';
import { admin_role_id, user_role_id } from "../constants.js";
import { generate_access_token, generate_refresh_token } from "../utils/token_generator_verify.js";
import { hashPassword, comparePassword, hashPhoneNumber, comparePhoneNumber } from "../utils/hash_password.js";
import { sendEmail } from "../utils/email_service_otp_send.js";
import { generateOTP, getOtpHtml } from "../utils/generate_otp.js";


const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone_number } = req.body;
        if (!name || !email || !password || !phone_number) {
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

        //OTP generation and sending email
        const otp = generateOTP();
        const otpHtml = getOtpHtml(otp);

        // Store OTP in database with expiration time (e.g., 10 minutes)
        const otp_hash = await bcrypt.hash(otp, 10);

        await DB.promise().query(
            'INSERT INTO otps (user_id, email, otp_code_hash, otp_type, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
            [insertUser.insertId, email, otp_hash, 'email_verification']
        );

        await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`, otpHtml);


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
        res.status(500).json({ message: 'Internal server error from registerUser' });
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

        //check Otp verification
        if (user.is_verified === 0) {
            return res.status(400).json({ message: 'User not verified. Please verify your email before logging in.' });
        }

        //create token
        const refresh_token = generate_refresh_token(user.id, user.full_name, user.email, user.role_id);

        const refresh_token_hash = await bcrypt.hash(refresh_token, 10);

        //create user session
        const [session] = await DB.promise().query(
            'INSERT INTO user_sessions (refresh_token_hash, user_id) VALUES (?, ?)',
            [refresh_token_hash, user.id]
        );

        //generate access token
        const access_token = generate_access_token(user.id, user.full_name, user.email, user.role_id);


        res.cookie('refreshToken', refresh_token, {
            httpOnly: true,
            secure: true,
            samesite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        })


        res.status(200).json({
            message: 'Login successful',
            session_id: session.insertId,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email
            },
            accessToken: access_token,
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error from loginUser' });
    }
};


const OTP_verification = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required!"
            });
        }

        // Find OTP record
        const [otpRecord] = await DB.promise().query(
            `SELECT * 
             FROM otps
             WHERE email = ?`,
            [email]
        );



        if (otpRecord.length === 0) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const record = otpRecord[0];


        // Check if OTP expired
        if (new Date(record.expires_at) < new Date()) {
            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        // Compare OTP with hashed OTP
        const isMatch = await bcrypt.compare(
            otp,
            record.otp_code_hash
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // Verify user
        await DB.promise().query(
            `UPDATE users
             SET is_verified = 1
             WHERE email = ?`,
            [email]
        );

        // Delete OTP after successful verification
        await DB.promise().query(
            `DELETE FROM otps
             WHERE email = ?`,
            [email]
        );

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("Server Error From Verification:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


const refresh = async (req, res) => {
    try {
        const token = req.cookies.Token || req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [session] = await DB.promise().query(
            'SELECT user_id, refresh_token_hash FROM user_sessions WHERE user_id = ?', [decoded.id]
        );


        if (session.length === 0) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        //create new refresh_token
        const refresh_token = generate_refresh_token(decoded.id, decoded.name, decoded.email, decoded.role_id);
        const refresh_token_hash = bcrypt.hash(refresh_token, 10);

        //update refresh_token_hash on database
        await DB.promise().querry(
            'UPDATE refresh_token_hash FROM user_sessions WHERE user_id=?', [decoded.id]
        )

        //create new access token
        const access_token = generate_access_token(decoded.id, decoded.name, decoded.email, decoded.role_id)

    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal server error from refresh' });
    }
}

export { registerUser, loginUser, refresh, OTP_verification };