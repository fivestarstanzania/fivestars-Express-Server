// models/SellerApplication.js
import mongoose from 'mongoose';

const SellerApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    businessAddress: {
        street: { type: String, required: true },
        region: { type: String, required: true },
    },
    profileImage: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: String,
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
});

export default mongoose.model('SellerApplication', SellerApplicationSchema);