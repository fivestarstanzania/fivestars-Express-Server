
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    googleId: String,
    appleId: String,
    authMethod: String,
    email: {
        type: String,
        unique: true
    },
    name: String,
    expoPushToken: {
      type:String,
      default: null
    },
    sellerApplication: {
      status: {
          type: String,
          enum: ['not-applied', 'pending', 'approved', 'rejected'],
          default: 'not-applied'
      },
      rejectionReason: String
    },
    role: { 
      type: String, 
      enum: ['customer', 'banned-seller', 'pending-seller', 'seller'],
      default: 'customer' 
    },
    createdAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: { // For legal record-keeping (without personal data)
    type: Date,
    default: null
  }
},{
  timestamps: true
});

// Cleanup before user deletion
UserSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const userId = this._id;
  
  try {
    // 1. Optional: Add any data cleanup needed
    // Example: await removeUserFromExternalServices(userId);
    
    // 2. Mark deletion time (maintains deletion record)
    this.deletedAt = new Date();
    await this.save();
    
    next();
  } catch (error) {
    console.error(`User cleanup failed for ${userId}:`, error);
    next(error); // Aborts deletion
  }
});


UserSchema.index({ deletedAt: 1 });
export default mongoose.model('User', UserSchema);

