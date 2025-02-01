import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ["Product", "Seller"], 
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", 
      required: function () {
        return this.reviewType === "Product";
      }, 
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller", 
      required: function () {
        return this.reviewType === "Seller";
      }, 
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, 
      max: 5, 
    },
    reviewText: {
      type: String,
      maxlength: 1000, 
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model("Review", reviewSchema);
