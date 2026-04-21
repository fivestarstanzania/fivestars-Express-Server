
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
      enum: ["Pending", "Received", "Confirmed", "Delivered", "Cancelled"],
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
        ref: 'User', 
        required: true 
      },
      name:{
        type: String,
        required: true,
      },
      phone: {
        type: String,
        default: "",
      },
      
    },
    product: {
      productImage: { 
        type: String, 
        required: true 
      },
      selectedImageUrl: { 
        type: String 
      }, // optional field for the chosen image
      productPrice: { 
        type: Number, 
        required: true 
      }, // unit price
      id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      // NEW FIELDS:
      quantity: { 
        type: Number, 
        required: true, 
        default: 1 
      },
      size: { 
        type: String 
      },
      totalPrice: { type: Number, required: true }, // unitPrice * quantity
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
