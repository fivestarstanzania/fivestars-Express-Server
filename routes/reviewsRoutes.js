import express from "express";
import { createReview, getReviews } from "../controllers/reviewsController.js";

const router = express.Router();

// Create a new review
router.post("/create", createReview);
// Retrieve reviews for a product or seller
router.get("/get/:reviewType/:id", getReviews);

export default router;
