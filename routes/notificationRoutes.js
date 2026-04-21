import express from "express";
import { getNotifications, getUnreadNotifications, markNotificationAsRead, sendNotification } from "../controllers/notificationController.js";
import { notificationRateLimiter } from '../middleware/securityMiddleware.js';
import { validateMarkNotificationReadRequest, validateNotificationSendRequest } from '../middleware/requestValidation.js';

const router = express.Router();

router.post("/send", notificationRateLimiter, validateNotificationSendRequest, sendNotification);
router.get("/", getNotifications);

router.get("/unread", getUnreadNotifications);
router.put("/mark-as-read/:id", notificationRateLimiter, validateMarkNotificationReadRequest, markNotificationAsRead);


export default router;
