import { Schema, model } from 'mongoose';

const ProductSchema = new Schema(
  {
    imageUrl: { type: String, required: true }, 
    imageUrls:{type:[String],
      required:true,
    },
    description: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercentage: {
      type: Number
    },
    regularPrice: {
      type: Number
    },
    wholesalePrice: {
      type: Number
    },
    supplierName: {
      type: String
    },
    supplierContat:{
      type: String
    },
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
    category: {
      type: String,
      required: true,
      enum: [
        "home_items",
        "electronics",
        "food",
        "clothes",
        "shoes",
        "personal_care",
        "fashion_accessories",
        "stationery",
        "health_wellbeing",
        "furniture",
        "books"
      ]
    },
    subcategory: { type: String },
    // Field to indicate whether the product is verified by an admin
    verified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sellerStatus: {
      type: String,
      default: "Active", 
      required: true
    },
    clickCount: {
      type: Number,
      default: 0
    },
    soldCount: {
      type: Number,
      default: 0
    },
    wishlistsCount: {
      type: Number,
      default: 0
    },
    likesCount: {
      type: Number,
      default: 0
    },
    returnPolicy: {
      type: String,
      required: true
    },
    quantity: { type: Number },
    deliveryOption: { type: String, enum: ["Free", "Paid"] },
    // Use a flexible field to store any extra, category-specific attributes.
    // For example, "specifications" may include fields like brand, model, size, warranty, ingredients, etc.
    specifications: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);
ProductSchema.pre('save', function(next) {
  if (this.regularPrice && this.price && this.regularPrice > this.price) {
    this.discountPercentage = Math.round(((this.regularPrice - this.price) / this.regularPrice) * 100);
  } else {
    this.discountPercentage = 0;
  }
  next();
});

ProductSchema.index({description: 'text' });
ProductSchema.index({title: 'text' });
ProductSchema.index({subcategory: 'text' });
ProductSchema.index({specifications: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ userId: 1 });
ProductSchema.index({ createdAt: -1 });

export default model('Product', ProductSchema);
