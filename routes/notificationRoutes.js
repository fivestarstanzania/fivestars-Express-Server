import express from "express";
import { getAllNotificationsForAdmin, getNotifications, getUnreadNotifications, markNotificationAsRead, sendNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/send", sendNotification);
router.get("/sameja", getAllNotificationsForAdmin);
router.get("/", getNotifications);

router.get("/unread", getUnreadNotifications);
router.put("/mark-as-read/:id", markNotificationAsRead);


export default router;
