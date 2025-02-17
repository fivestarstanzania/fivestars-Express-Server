import express from 'express';
import userController from '../controllers/userController.js';
import { validateAndSanitizeRegistration, validateAndSanitizeLogin } from '../middleware/validationMiddleware.js';
import { handleValidationErrors } from '../middleware/errorHandlingMiddleware.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();

// POST route for user registration
router.post('/register', validateAndSanitizeRegistration, handleValidationErrors, userController.register);
router.post("/login", validateAndSanitizeLogin, handleValidationErrors, userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/update-expo-push-token', authMiddleware, userController.updateExpoToken)
router.get('/', authMiddleware, userController.checkAuth);
export default router;
