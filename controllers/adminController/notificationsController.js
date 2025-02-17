import Notification from "../../models/notificationModel.js";


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