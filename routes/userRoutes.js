import express from "express"; 
import { checkAuth, logout, refreshToken, registerGoogleUsers, registerAppleUsers, updateExpoToken, deleteUserAccount } from "../controllers/UsersController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkBlacklist } from "../middleware/checkBlacklist.js";
import { recordVisit } from "../controllers/recordVisit.js";

const router=express.Router();


router.post('/google-login', registerGoogleUsers)
router.post('/analytics/visit',  recordVisit);
router.post('/apple-login', registerAppleUsers)
router.post('/update-expo-push-token', authMiddleware, updateExpoToken)
router.post('/refresh-token',checkBlacklist, refreshToken)
router.post('/logout', logout)
router.get('/', authMiddleware, checkAuth);
router.delete('/delete-account', authMiddleware, deleteUserAccount )
export default router;