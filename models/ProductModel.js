import { Schema, model } from 'mongoose';

const ProductSchema = new Schema(
  {
    imageUrl: { type: String, required: true }, 
    description: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: String, required: true },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', // Reference to the User model
      required: true 
    },
    sellerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Seller', // Reference to the User model
      required: true 
    },
    sellerStatus: {
      type: String,
      default: "Active", 
      required: true
    },
    category:{type: String, required: true}
  },
  { timestamps: true }
);

ProductSchema.index({description: 'text' });
ProductSchema.index({title: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ userId: 1 });
ProductSchema.index({ createdAt: -1 });

export default model('Product', ProductSchema);
