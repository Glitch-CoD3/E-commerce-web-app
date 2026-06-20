import express from 'express';

const router = express.Router();
import { registerUser, loginUser, refresh, OTP_verification, log_out } from '../controllers/auth.controller.js';

/**
 * @name POST /api/v1/auth
 * @description user can register by using this api
 *@access public 
 */
router.post('/register', registerUser);

/**
 * @name POST /api/v1/auth
 * @description Email OTP vefify by using this api
 *@access public 
 */
router.post('/email-verify', OTP_verification)

/**
 * @name POST /api/v1/auth
 * @description user can login by using this api after register and verification
 *@access private 
 */
router.post('/login', loginUser);


/**
 * @name POST /api/v1/auth
 * @description user can loggeg out by using this api
 *@access private 
 */
router.post('/logout', log_out);

/**
 * @name POST /api/v1/auth
 * @description Auto generate new access and refresh token at each refresh only for loggedin users
 *@access private 
 */
router.post('/refresh', refresh);

export default router;