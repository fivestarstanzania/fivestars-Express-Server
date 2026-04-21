import express from 'express';
import { createOrder, getAllOrders, getOrderDetails, getRecentOrders, getSellerOrders, getTotalNumberPendingOrders, updateOrderStatus } from "../controllers/orderController.js";
import { orderRateLimiter } from '../middleware/securityMiddleware.js';
import { validateCreateOrderRequest, validateOrderDetailsQuery, validateOrderStatusUpdateRequest } from '../middleware/requestValidation.js';
const router = express.Router();

router.post("/create", orderRateLimiter, validateCreateOrderRequest, createOrder);
router.put("/update-status/:orderId", orderRateLimiter, validateOrderStatusUpdateRequest, updateOrderStatus);
router.get("/user", getAllOrders)
router.get("/seller", getSellerOrders)
router.get('/seller/total-orders',getTotalNumberPendingOrders)
router.get("/seller/recent", getRecentOrders)
router.get("/details", validateOrderDetailsQuery, getOrderDetails)

export default router;