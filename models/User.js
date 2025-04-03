
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    googleId: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    expoPushToken: {
      type:String,
      default: null
    },
    role: { 
      type: String, 
      enum: ['customer', 'banned-seller', 'pending-seller', 'seller'],
      default: 'customer' 
    },
    createdAt: {
    type: Date,
    default: Date.now
  }
});
export default mongoose.model('User', UserSchema);

