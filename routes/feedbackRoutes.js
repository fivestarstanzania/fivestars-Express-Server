import express from 'express';
import { postFeedback } from '../controllers/feedbackController.js';
import { userActionRateLimiter } from '../middleware/securityMiddleware.js';
import { validateFeedbackRequest } from '../middleware/requestValidation.js';

const router = express.Router();

router.post('/', userActionRateLimiter, validateFeedbackRequest, postFeedback);


export default router;

