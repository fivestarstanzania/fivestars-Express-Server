import express from 'express';
import { createOrder, getAllOrders, getAllOrdersForAdmin, getOrderDetails, getRecentOrders, getSellerOrders, updateOrderStatus } from "../controllers/orderController.js";
const router = express.Router();

router.post("/create", createOrder);
router.post("/update-status/:orderId", updateOrderStatus);
router.get("/user", getAllOrders)
router.get("/sameja", getAllOrdersForAdmin)
router.get("/seller", getSellerOrders)
router.get("/seller/recent", getRecentOrders)
router.get("/details", getOrderDetails)

export default router;