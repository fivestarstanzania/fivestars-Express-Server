import express from "express";
import { getNotifications, getUnreadNotifications, markNotificationAsRead, sendNotification } from "../controllers/notificationController.js";
import { validateNotification } from "../middleware/validateNotification.js";

const router = express.Router();

router.post("/send",validateNotification, sendNotification);
router.get("/", getNotifications);

router.get("/unread", getUnreadNotifications);
router.put("/mark-as-read/:id", markNotificationAsRead);


export default router;
