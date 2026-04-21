import express from "express"; 
import { checkAuth, logout, refreshToken, registerGoogleUsers, registerAppleUsers, updateExpoToken, deleteUserAccount } from "../controllers/UsersController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkBlacklist } from "../middleware/checkBlacklist.js";
import { recordVisit } from "../controllers/recordVisit.js";
import { analyticsRateLimiter, authRateLimiter, userActionRateLimiter } from "../middleware/securityMiddleware.js";
import { validateAppleLoginRequest, validateExpoPushTokenUpdate, validateGoogleLoginRequest, validateRefreshTokenRequest, validateVisitPayload } from "../middleware/requestValidation.js";

const router=express.Router();


router.post('/google-login', authRateLimiter, validateGoogleLoginRequest, registerGoogleUsers)
router.post('/analytics/visit', analyticsRateLimiter, validateVisitPayload, recordVisit);
router.post('/apple-login', authRateLimiter, validateAppleLoginRequest, registerAppleUsers)
router.post('/update-expo-push-token', authMiddleware, userActionRateLimiter, validateExpoPushTokenUpdate, updateExpoToken)
router.post('/refresh-token', authRateLimiter, validateRefreshTokenRequest, checkBlacklist, refreshToken)
router.post('/logout', userActionRateLimiter, validateRefreshTokenRequest, logout)
router.get('/', authMiddleware, checkAuth);
router.delete('/delete-account', authMiddleware, userActionRateLimiter, deleteUserAccount )
export default router;