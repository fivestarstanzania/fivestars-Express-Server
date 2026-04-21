import express from "express";
import { createReview, getReviews } from "../controllers/reviewsController.js";
import { reviewRateLimiter } from '../middleware/securityMiddleware.js';
import { validateCreateReviewRequest, validateReviewLookupRequest } from '../middleware/requestValidation.js';

const router = express.Router();

// Create a new review
router.post("/create", reviewRateLimiter, validateCreateReviewRequest, createReview);
// Retrieve reviews for a product or seller
router.get("/get/:reviewType/:id", validateReviewLookupRequest, getReviews);

export default router;
