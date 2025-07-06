import { Schema, model } from 'mongoose';

const LikedProductsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries (user + product)
LikedProductsSchema.index({ user: 1, product: 1 }, { unique: true });

export default model('LikedProducts', LikedProductsSchema);