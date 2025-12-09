// models/ProductClickLog.js
import { Schema, model } from 'mongoose';

const ProductClickLogSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  productTitle: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  source: { 
    type: String, 
    enum: ["search", "home", "category", "offer","sellerProfile","popular", "other"], 
    default: "other" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for efficient queries
ProductClickLogSchema.index({ productId: 1, createdAt: -1 });

export default model("ProductClickLog", ProductClickLogSchema);
