import express from 'express';
import { getAllFeedback, postFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', postFeedback);
router.get('/', getAllFeedback);

export default router;

