import Notification from "../models/notificationModel.js";
import { getReceiverSocketId,io } from "../socket/socket.js";

export async function sendNotification(req, res) {
  try {
    const { receiverId, message } = req.body;

    // Save the notification to the database
    const newNotification = new Notification({ receiverId, message });
    await newNotification.save();

    // Emit a real-time notification via Socket.IO
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("newNotification", newNotification);
    }

    res.status(201).json({ message: "Notification sent and saved!", notification: newNotification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send notification" });
  }
}

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

    
    const receiverSocketId = getReceiverSocketId(userId);
    
    if (receiverSocketId) {
      console.log(receiverSocketId)
      io.to(receiverSocketId).emit("update-notification", notification);
      console.log(receiverSocketId)
    }
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error });
  }
}

export async function getNotifications(req, res) {
  const userId = req.user._id;
  try {
    //const { userId } = req.params; // Extract receiverId from request params

    // Fetch notifications where receiverId matches the provided id, sorted by latest
    const notifications = await Notification.find({ receiverId: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    // Return notifications
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }

}

export async function getUnreadNotifications(req, res) {
  const userId = req.user._id;
  try {
    // Fetch all unread notifications for the user (isRead: false)
    const unreadNotifications = await Notification.find({ receiverId: userId, isRead: false })

    // Return unread notifications and their count
    res.status(200).json({
      unreadCount: unreadNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching unread notifications' });
  }
}


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