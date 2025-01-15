import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String, 
    required: true,
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
});

export default mongoose.model('Notification', notificationSchema);
