import mongoose from 'mongoose';

const SellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String, 
    default: null,
  },
  description: {
    type: String,
    required: true,
  },

  // Business Information 
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  businessAddress: {
    street: { type: String, required: true },
    region: { type: String, required: true },
  },

  activityStatus: { 
    type: String, 
    enum: ['PendingAgreement', 'Active', 'Inactive', 'Banned'],
    default: "PendingAgreement",
  },
  hasAgreedToTerms: {
    type: Boolean,
    default: false
  },
  uploadLimit: { 
    type: Number, 
    default: 30 
  },
},
{
  timestamps: true, 
}
);

export default mongoose.model('Seller', SellerSchema);
