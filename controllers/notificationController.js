import Notification from "../models/notificationModel.js";
import User from "../models/User.js";
import {io, getReceiverSocketId } from "../socket/socket.js";
import { sendExpoPushNotification } from "../utils/sendNotification.js";

export async function sendNotification(req, res) {
  try {
    const { receiverId, message, title, type, metadata, sendToAll } = req.body;

    // Send to all users
    if (sendToAll) {
      const users = await User.find({}, '_id expoPushToken');
      
      const notifications = users.map(user => ({
        receiverId: user._id,
        title,
        message,
        type,
        metadata
      }));
      await Notification.insertMany(notifications);
      io.emit('newGlobalNotification');

      // Send push notifications
      const pushPromises = users.map(user => 
        sendExpoPushNotification(user.expoPushToken, title, message)
      );
      await Promise.allSettled(pushPromises);

      return res.status(201).json({ message: "Notification sent to all users!" });
    }


    // Send to specific user
    const newNotification = new Notification({ 
      receiverId, 
      title,
      message,
      type,
      metadata
    });
    await newNotification.save();
    
    // Emit via socket
    const socketId = getReceiverSocketId(receiverId);
    if (socketId) io.to(socketId).emit('newNotification', newNotification);

    // Push notification
    const user = await User.findById(receiverId, 'expoPushToken');
    await sendExpoPushNotification(user?.expoPushToken, title, message);

    res.status(201).json(newNotification);
  } catch (error) {
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

