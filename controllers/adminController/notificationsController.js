import Notification from "../../models/notificationModel.js";
import User from "../../models/User.js";
import { sendExpoPushNotification } from "../../utils/sendNotification.js";
import {io, getReceiverSocketId } from "../../socket/socket.js";


// =========================================================
// 1. ADMIN — GET ALL NOTIFICATIONS
// =========================================================

export async function getAllNotificationsForAdmin(req, res) {
    try {
        // Fetch all products and count the total number
        const notifications = await Notification.find().sort({ createdAt: -1 });
       
        const totalNotifications = await Notification.countDocuments();

        // Respond with both the total number and the products
        res.status(200).json({
            total: totalNotifications,
            notifications: notifications,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to get the products" });
    }
}

// =========================================================
// 2. ADMIN — SEND TO SPECIFIC USER
// =========================================================
export async function adminSendNotification(req, res) {
  try {
    const { title, message, type, metadata } = req.body;
    const receiverId = req.params.id;

    if (!receiverId || !title || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const newNotification = new Notification({
      receiverId,
      title,
      message,
      type,
      metadata: metadata || {},
    });

    await newNotification.save();

    // SOCKET
    const socketId = getReceiverSocketId(receiverId);
    if (socketId) io.to(socketId).emit("newNotification", newNotification);

    // PUSH
    const user = await User.findById(receiverId, "expoPushToken");
    if (user?.expoPushToken) {
      sendExpoPushNotification(user.expoPushToken, title, message);
    }

    res.status(201).json({
      message: "Notification sent",
      notification: newNotification,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to send notification" });
  }
}



// =========================================================
// 3. ADMIN — BROADCAST (ALL / BUYER / SELLER)
// =========================================================
export async function adminBroadcastNotification(req, res) {
  try {
    const { title, message, type, toward } = req.body;

    if (!title || !message || !toward) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Create ONLY ONE notification record
    const newNotification = new Notification({
      receiverId: null,
      title,
      message,
      type,
      metadata: { toward },
    });

    await newNotification.save();

    // SELECT TARGET USERS FOR PUSH
    let users = [];

    if (toward === "customer") {
      users = await User.find({ role: "customer", expoPushToken: { $exists: true } });
    } 
    else if (toward === "seller") {
      users = await User.find({ role: "seller", expoPushToken: { $exists: true } });
    } 
    else if (toward === "all") {
      users = await User.find({ expoPushToken: { $exists: true } });
    }

    // PUSH NOTIFICATIONS
    users.forEach(u => {
      if (u.expoPushToken) {
        sendExpoPushNotification(u.expoPushToken, title, message);
      }
    });

    // SOCKET BROADCAST
    io.emit("broadcastNotification", {
      toward,
      notification: newNotification,
    });

    res.status(201).json({
      message: "Broadcast sent",
      notification: newNotification,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to broadcast notification" });
  }
}


// =========================================================
// 4. GET SINGLE NOTIFICATION DETAIL
// =========================================================
export async function getNotificationDetail(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get notification details" });
  }
}



// =========================================================
// 5. DELETE NOTIFICATION
// =========================================================
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
}


// =========================================================
// 6. MARK AS READ / UNREAD
// =========================================================
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const { isRead } = req.body; // true or false

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: `Notification marked as ${isRead ? "read" : "unread"}`,
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update notification status" });
  }
}


// =========================================================
// 7. UPDATE NOTIFICATION DETAILS (FOR EDIT)
// =========================================================
export async function updateNotification(req, res) {
  try {
    const { id } = req.params;
    const { title, message, type, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { title, message, type, metadata },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification updated successfully",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update notification" });
  }
}
