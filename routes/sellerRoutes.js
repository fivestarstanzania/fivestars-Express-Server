import express from "express";
import {
  agreeToTerms,
  getAllSellersSortedByProducts,
  getMyApplication,
  getSellerById,
  getTopSellers,
  submitApplication
} from "../controllers/sellerController.js"; // Path to your controller file

const router = express.Router();

router.get("/get/:userId", getSellerById);
// Get top sellers (for home screen)
router.get('/top', getTopSellers);
// Get all sellers sorted by product count
router.get('/all', getAllSellersSortedByProducts);
router.put("/agree-terms", agreeToTerms);
router.post("/seller-applications", submitApplication);
router.get("/seller-applications/user/:userId", getMyApplication);

export default router;
