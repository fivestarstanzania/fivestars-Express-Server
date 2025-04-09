import express from "express";
import {
  agreeToTerms,
  getMyApplication,
  getSellerById,
  submitApplication
} from "../controllers/sellerController.js"; // Path to your controller file

const router = express.Router();

router.get("/get/:userId", getSellerById);
router.put("/agree-terms", agreeToTerms);
router.post("/seller-applications", submitApplication);
router.get("/seller-applications/user/:userId", getMyApplication);

export default router;
