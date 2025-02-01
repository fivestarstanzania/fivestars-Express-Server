import { Schema, model } from 'mongoose';

const ProductSchema = new Schema(
  {
    imageUrl: { type: String, required: true }, 
    description: { type: String, required: true },
    price: { type: String, required: true },
    uploadedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', // Reference to the User model
      required: true 
    },
    category:{type: String, required: true}
  },
  { timestamps: true }
);

ProductSchema.index({description: 'text' });

export default model('Product', ProductSchema);
