import express from "express";
import {
  agreeToTerms,
  getSellerById,
} from "../controllers/sellerController.js"; // Path to your controller file

const router = express.Router();

router.get("/get/:userId", getSellerById);
router.put("/agree-terms", agreeToTerms);



export default router;
