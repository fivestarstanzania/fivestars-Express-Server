import { Schema, model } from 'mongoose';

const WishlistSchema = new Schema(
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
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });

export default model('Wishlist', WishlistSchema);