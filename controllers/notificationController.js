import Notification from "../models/notificationModel.js";
import User from "../models/User.js";
import {io, getReceiverSocketId } from "../socket/socket.js";
import { sendExpoPushNotification } from "../utils/sendNotification.js";


// ========================================================
// 1. Send notification TO SPECIFIC USER ONLY
// ========================================================
export async function sendNotification(req, res) {
  try {
    const { receiverId, message, title, type, metadata } = req.body;

    if (!receiverId || !title || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Send to specific user
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
    if (socketId) {
      io.to(socketId).emit("newNotification", newNotification);
    }

    // PUSH NOTIFICATION
    const user = await User.findById(receiverId, "expoPushToken");
    if (user?.expoPushToken) {
      await sendExpoPushNotification(user.expoPushToken, title, message);
    }

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Failed to send notification" });
  }

}   


// ========================================================
// 2. Mark as read
// ========================================================
export async function markNotificationAsRead(req, res) {
  const userId = req.user._id;
  
  try {
    const { id } = req.params;

    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

   
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    
    //update notification with socket
    //console.log("before updated with socket", userId)  
    const receiverSocketId = getReceiverSocketId(userId.toString());
    //console.log("before updated with socket", receiverSocketId)  
    
    if(receiverSocketId){
      io.to(receiverSocketId).emit("updateNotification", notification)
      //console.log("updated")
    }
        

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error });
  }
}



// ========================================================
// 3. GET all notifications for user including broadcast
// ========================================================
export async function getNotifications(req, res) {
  const userId = req.user._id;

  try {
    // Fetch role from DB (safe for old tokens)
    const user = await User.findById(userId).select("role");
    const role = user?.role || "customer"; // fallback default

    const notifications = await Notification.find({
      $or: [
        { receiverId: userId }, // personal
        { receiverId: null, "metadata.toward": "all" }, // broadcast
        { receiverId: null, "metadata.toward": role }, // role-based broadcast
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ notifications });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Unable to get notifications" });
  }
}



// ========================================================
// 4. GET unread count
// ========================================================
export async function getUnreadNotifications(req, res) {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select("role");
    const role = user?.role || "customer";

    const unreadNotifications = await Notification.find({
      isRead: false,
      $or: [
        { receiverId: userId },
        { receiverId: null, "metadata.toward": "all" },
        { receiverId: null, "metadata.toward": role },
      ]
    });

    res.status(200).json({
      unreadCount: unreadNotifications.length,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to fetch unread notifications" });
  }
}



