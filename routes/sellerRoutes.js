import express from "express";
import {
  agreeToTerms,
  getAllSellersSortedByProducts,
  getMyApplication,
  getSellerById,
  getTopSellers,
  submitApplication
} from "../controllers/sellerController.js"; // Path to your controller file
import { sellerActionRateLimiter } from '../middleware/securityMiddleware.js';
import { validateAgreeTermsRequest, validateObjectIdParam, validateSellerApplicationRequest } from '../middleware/requestValidation.js';

const router = express.Router();

router.get("/get/:userId", validateObjectIdParam('userId', 'userId'), getSellerById);
// Get top sellers (for home screen)
router.get('/top', getTopSellers);
// Get all sellers sorted by product count
router.get('/all', getAllSellersSortedByProducts);
router.put("/agree-terms", sellerActionRateLimiter, validateAgreeTermsRequest, agreeToTerms);
router.post("/seller-applications", sellerActionRateLimiter, validateSellerApplicationRequest, submitApplication);
router.get("/seller-applications/user/:userId", validateObjectIdParam('userId', 'userId'), getMyApplication);

export default router;
