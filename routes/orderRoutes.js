import express from 'express';
import { createOrder, getAllOrders, getOrderDetails, getRecentOrders, getSellerOrders, getTotalNumberPendingOrders, updateOrderStatus } from "../controllers/orderController.js";
const router = express.Router();

router.post("/create", createOrder);
router.post("/update-status/:orderId", updateOrderStatus);
router.get("/user", getAllOrders)
router.get("/seller", getSellerOrders)
router.get('/seller/total-orders',getTotalNumberPendingOrders)
router.get("/seller/recent", getRecentOrders)
router.get("/details", getOrderDetails)

export default router;