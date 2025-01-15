
import { Schema, model } from 'mongoose';
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Received", "Confirmed", "Delivered"],
      default: "Pending",
    },
    buyer: {
      id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Reference to the User model
        required: true 
      },
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    seller: {
      id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', // Reference to the User model
        required: true 
      },
      name:{
        type: String,
        required: true,
      }
      
    },
    product: {
      productImage: {
        type: String,
        required: true,
      },
      productPrice: {
        type: Number,
        required: true,
      },
    },
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false,
      },
      comment: {
        type: String,
        trim: true,
        required: false,
      },
    },
  },
  {
    timestamps: true, 
  }
);

export default model('Order', orderSchema);
