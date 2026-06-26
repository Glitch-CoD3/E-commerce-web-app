import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();
import {
    registerUser, resend_otp, loginUser, refresh,
    OTP_verification, verify_resend_OTP, log_out, get_me,
    logout_all_devices, forgot_password, reset_password
} from '../controllers/auth.controller.js';



/**
 * @name POST /api/v1/auth
 * @description user can register
 *@access public 
 */
router.post('/register', registerUser);

/**
 * @name POST /api/v1/auth
 * @description Email OTP vefify 
 *@access registered 
 */
router.post('/email-verify', OTP_verification)

/**
 * @name POST /api/v1/auth
 * @description resend OTP for verify 
 *@access registered 
 */
router.post('/resend-otp', resend_otp)


/**
 * @name POST /api/v1/auth
 * @description user can login by using this api after register and verification
 *@access private 
 */
router.post('/login', loginUser);


/**
 * @name POST /api/v1/auth
 * @description user can logged out by using this api
 *@access private 
 */
router.post('/logout', verifyJWT, log_out);

/**
 * @name POST /api/v1/auth
 * @description user can logged out from all devices at a time by using this api
 *@access private 
 */
router.post('/logout-all-devices', verifyJWT, logout_all_devices);

/**
 * @name POST /api/v1/auth
 * @description Auto generate new access and refresh token at each refresh only for loggedin users
 *@access private 
 */
router.post('/refresh', verifyJWT, refresh);


/**
 * @name GET /api/v1/auth
 * @description user get self data
 *@access private 
 */
router.get('/get-me', verifyJWT, get_me)


/**
 * @name POST /api/v1/auth
 * @description Forgot password / vesify-reseOTP / reset-password
 *@access registered 
 */
router.post('/forgot-password', forgot_password)
router.post('/verify-reset-otp', verify_resend_OTP)
router.post('/reset-password', reset_password)

/**
 * @name POST /api/v1/auth
 * @description Logged in user can change password
 *@access private 
 */

router.put('/change-password', verifyJWT, reset_password)


export default router;