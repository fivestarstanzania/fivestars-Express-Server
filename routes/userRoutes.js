import express from "express"; 
import { checkAuth, logout, refreshToken, registerUsers, updateExpoToken } from "../controllers/UsersController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkBlacklist } from "../middleware/checkBlacklist.js";

const router=express.Router();


router.post('/google-login', registerUsers)
router.post('/update-expo-push-token', authMiddleware, updateExpoToken)
router.post('/refresh-token',checkBlacklist, refreshToken)
router.post('/logout', logout)
router.get('/', authMiddleware, checkAuth);
export default router;