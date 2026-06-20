import express from 'express';

const router = express.Router();
import { registerUser, loginUser, refresh, OTP_verification } from '../controllers/auth.controller.js';


router.post('/register', registerUser);
router.post('/email-verify', OTP_verification)
router.post('/login', loginUser);
router.post('/refresh', refresh);

export default router;