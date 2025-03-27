import express from "express";
import {
  getSellerById,
} from "../controllers/sellerController.js"; // Path to your controller file

const router = express.Router();

router.get("/get/:userId", getSellerById);



export default router;
