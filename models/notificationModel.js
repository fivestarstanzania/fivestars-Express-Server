import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String, 
    required: true,
  },
  type: {
    type: String,
    enum: ["Order", "Offer", "System", "Price_drop", "Others"], // Example types
    required: true,
  },
  metadata: {
    type: Object, // Additional data (e.g., order ID, product info)orderId: String, productId: String,offerId: String,deepLink: String 
    default: {},
  },
  isRead: {
    type: Boolean, 
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d',
  },
},
{
  timestamps: true, // Adds createdAt and updatedAt fields
}
);

export default mongoose.model('Notification', notificationSchema);
