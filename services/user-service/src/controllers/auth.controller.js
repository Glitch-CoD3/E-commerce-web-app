import DB from "../config/db.config.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { admin_role_id, user_role_id } from "../constants.js";
import { generate_access_token, generate_refresh_token } from "../utils/token_generator_verify.js";
import { hashPassword, comparePassword } from "../utils/hash_password.js";
import { sendEmail } from "../utils/email_service_otp_send.js";
import { generateOTP, getOtpHtml } from "../utils/generate_otp.js";

/**
 * @name POST /api/v1/auth/register
 * @description User can registered by this
 *@access public 
 */
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

        // Insert user
        const [insertUser] = await DB.promise().query(
            'INSERT INTO users (full_name, email, password_hash, phone_number) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, phone_number]
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


/**
 * @name POST /api/v1/auth/login
 * @description  registered and verified user can login 
 *@access private 
 */

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Find user
        const [users] = await DB.promise().query(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                message: "User not registered."
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await comparePassword(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid credentials."
            });
        }

        // Verify email
        if (user.is_verified === 0) {
            return res.status(400).json({
                message: "Please verify your email first."
            });
        }

        const ip_address = req.ip;
        const user_agent = req.headers["user-agent"];

        // ================================
        // Step 1: Create session
        // ================================
        const [session] = await DB.promise().query(
            `INSERT INTO user_sessions
            (user_id, role_id, ip_address, user_agent)
            VALUES (?, ?, ?, ?)`,
            [
                user.id,
                user.role_id,
                ip_address,
                user_agent
            ]
        );

        const sessionId = session.insertId;

        // ================================
        // Step 2: Generate tokens
        // ================================
        const access_token = generate_access_token({
            id: user.id,
            role_id: user.role_id,
            full_name: user.full_name,
            email: user.email,
        });

        const refresh_token = generate_refresh_token({
            id: user.id,
            role_id: user.role_id,
            session_id: sessionId,
        });

        // ================================
        // Step 3: Hash refresh token
        // ================================
        const refresh_token_hash = await bcrypt.hash(refresh_token, 10);

        // ================================
        // Step 4: Save hash
        // ================================
        await DB.promise().query(
            `UPDATE user_sessions
             SET refresh_token_hash = ?
             WHERE id = ?`,
            [
                refresh_token_hash,
                sessionId
            ]
        );

        // ================================
        // Step 5: Store refresh token
        // ================================
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // ================================
        // Response
        // ================================
        return res.status(200).json({
            message: "Login successful.",
            session_id: sessionId,
            accessToken: access_token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


/**
 * @name POST /api/v1/auth/email-verify
 * @description Register user be verified by email OTP
 *@access public 
 */
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
             WHERE email = ? AND otp_type = 'email_verification'`,
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
             SET is_verified = 1, status ='active'
             WHERE email = ?`,
            [email]
        );

        // Delete OTP after successful verification
        await DB.promise().query(
            `DELETE FROM otps WHERE email = ?`, [email]
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


/**
 * @name POST /api/v1/auth/resend-otp
 * @description Register user be verified by email OTP
 *@access public 
 */

const resend_otp = async (req, res) => {

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        // Check user exists
        const [users] = await DB.promise().query(
            `SELECT id, is_verified
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }



        // Delete old verification OTP
        await DB.promise().query(
            `DELETE FROM otps
             WHERE email = ?
             AND otp_type = 'email_verification'`,
            [email]
        );

        //New OTP generation and sending email
        const otp = generateOTP();
        const otpHtml = getOtpHtml(otp);

        // Store OTP in database with expiration time (e.g., 10 minutes)
        const otp_hash = await bcrypt.hash(otp, 10);

        await DB.promise().query(
            'INSERT INTO otps (user_id, email, otp_code_hash, otp_type, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
            [users[0].id, email, otp_hash, 'email_verification']
        );

        await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`, otpHtml);


        return res.status(200).json({
            success: true,
            message: "A new verification OTP has been sent."
        });

    } catch (error) {
        console.error("Resend OTP Error:", error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
}


/**
 * @name POST /api/v1/auth/verify-reset-otp
 * @description Register user be verified by email OTP
 *@access public 
 */

const verify_resend_OTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required."
            });
        }

        const [OTP] = await DB.promise().query(
            `SELECT *
             FROM otps
             WHERE email = ?
             AND otp_type = 'email_verification'`,
            [email]
        );

        if (OTP.length === 0) {
            return res.status(400).json({
                message: "OTP not found."
            });
        }

        const otpData = OTP[0];

        if (new Date() > new Date(otpData.expires_at)) {
            return res.status(400).json({
                message: "OTP expired."
            });
        }



        const matched = await bcrypt.compare(
            otp,
            otpData.otp_code_hash
        );

        if (!matched) {
            return res.status(400).json({
                message: "Invalid OTP."
            });
        }

        // Optional: mark user verified
        await DB.promise().query(
            `UPDATE users
             SET is_verified = 1,
             status = 'active'
             WHERE email = ?
             AND is_verified = 0
             AND status = 'inactive'`,
            [email]
        );

        // Delete used OTP
        await DB.promise().query(
            `DELETE FROM otps
             WHERE email = ?
             AND id = ?`,
            [email, otpData.id]
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified."
        });

    } catch (error) {
        console.error("Verify Reset OTP Error:", error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};
/**
 * @name POST /api/v1/auth/logout
 * @description Logged in verified user can logout
 *@access private 
 */

const log_out = async (req, res) => {
    try {
        const user = req.user;

        const session_id = user.session_id;

        const [sessions] = await DB.promise().query(
            `SELECT id, revoked
            FROM user_sessions
            WHERE id = ? AND revoked = 0`,
            [session_id]
        );


        if (sessions.length === 0) {
            return res.status(401).json({
                message: "Session not found or revoked"
            });
        }


        //update on database 
        await DB.promise().query(
            `UPDATE user_sessions SET revoked = 1 WHERE id= ? `, [session_id]
        )

        //clear refreshToken from cookie
        res.clearCookie('refreshToken')

        return res.status(200).json({
            session_id: session_id,
            success: 'success',
            message: 'Logout Successfully'
        })

    } catch (error) {
        console.error("Logout error ", error);
        return res.status(401).json({ message: 'Unauthorized for logout' });
    }
}


/**
 * @name POST /api/v1/auth/logout-all
 * @description Logged in verified user can logout
 *@access private 
 */
const logout_all_devices = async (req, res) => {
    try {
        const user_id = req.user?.id

        if (!user_id) {
            return res.status(401).json({
                message: 'Unauthorized user request'
            });
        }

        const [result] = await DB.promise().query(
            `UPDATE user_sessions
             SET revoked = 1
             WHERE user_id = ? AND revoked = 0`,
            [user_id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'No active sessions found'
            });
        }

        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error('Logout all devices error:', error);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


/**
 * @name POST /api/v1/auth/refresh
 * @description Create new refresh and accessToken ( Token Rotation)
 *@access private 
 */
const refresh = async (req, res) => {
    try {

        const user = req.user

        const [session] = await DB.promise().query(
            'SELECT user_id, revoked FROM user_sessions WHERE user_id = ? AND revoked = ?', [user.id]
        );

        if (session.length === 0) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        //create new refresh_token
        const refresh_token = generate_refresh_token(user.id, user.name, user.email, user.role_id);
        const refresh_token_hash = await bcrypt.hash(refresh_token, 10);

        // Update refresh token hash in database
        await DB.promise().query(
            `UPDATE user_sessions
            SET refresh_token_hash = ?
            WHERE user_id = ?`,
            [refresh_token_hash, user.id]
        );

        //create new access token
        const access_token = generate_access_token(decoded.id, decoded.name, decoded.email, decoded.role_id)

        //set refreshToken on cookie
        res.cookie('refreshToken', refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        })


        return res.status(201)
            .json({
                session_id: session[0].id,
                message: 'Tokens are refreshed',
                access_token
            })
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal server error from refresh' });
    }
}


/**
 * @name POST /api/v1/auth/get-me
 * @description user get self data
 *@access private 
 */

const get_me = async (req, res) => {
    try {
        const user_id = req.user?.id

        if (!user_id) {
            return res.status(401).json({
                message: 'Unauthorized user request'
            })
        }

        const [user_data] = await DB.promise().query(
            `SELECT full_name, email, phone_number FROM users WHERE id = ?`, [user_id]
        )

        if (user_data.length === 0) {
            return res.status(401).json({
                message: 'User no Found'
            })
        }

        const user = user_data[0]

        return res.status(200).json({
            success: "success",
            user: user
        })

    } catch (error) {
        console.error("Internal server Error", error)
        return res.status(500).json({
            message: "Internel server Error From get_me Controller"
        })
    }
}


/**
 * @name POST /api/v1/auth/forgot-password
 * @name POST /api/v1/auth/reset-password
 * @description User can change his password if they forget their password
 *@access public 
 */

const forgot_password = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const [users] = await DB.promise().query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        );

        // Don't reveal whether the email exists
        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "If a user with that email exists, a password reset OTP has been sent."
            });
        }

        //OTP generation and sending email
        const otp = generateOTP();
        const otpHtml = getOtpHtml(otp);

        // Store OTP in database with expiration time (e.g., 10 minutes)
        const otp_hash = await bcrypt.hash(otp, 10);

        await DB.promise().query(
            'INSERT INTO otps (user_id, email, otp_code_hash, otp_type, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
            [insertUser.insertId, email, otp_hash, 'reset_password']
        );

        await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`, otpHtml);

        return res.status(200).json({
            success: true,
            message: "If a user with that email exists, a password reset OTP has been sent."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};


const reset_password = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const [user] = await DB.promise().query(
            `SELECT *
             FROM users
             WHERE email = ?
             AND is_verified = 1`,
            [email]
        );

        if (user.length === 0) {
            return res.status(401).json({
                message: "User not verified"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await DB.promise().query(
            `UPDATE users
             SET password_hash = ?
             WHERE email = ?`,
            [hashedPassword, email]
        );

        return res.json({
            message: "Password reset successfully."
        });
    } catch (error) {
        console.error("reset password error: ", error)
        return res.status(500).json({
            Error: "Error From reset_password controller"
        })
    }
};


export {
    registerUser, resend_otp, loginUser, refresh,
    OTP_verification, verify_resend_OTP, log_out, get_me,
    logout_all_devices, forgot_password, reset_password,
};