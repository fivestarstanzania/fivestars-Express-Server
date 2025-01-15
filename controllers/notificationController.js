import Notification from "../models/notificationModel.js";
import { getReceiverSocketId } from "../socket/socket.js";

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
