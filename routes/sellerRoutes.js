import express from "express";
import {
  createSeller,
  getSellerById,
  deleteSellerById,
} from "../controllers/sellerController.js"; // Path to your controller file

const router = express.Router();


router.post("/create", createSeller);


router.get("/get/:id", getSellerById);


router.delete("/delete/:id", deleteSellerById);

export default router;
