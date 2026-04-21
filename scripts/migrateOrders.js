
import mongoose from "mongoose";
import  Order from "../models/OrderModel.js";
import dotenv from "dotenv";
dotenv.config();

async function runMigration() {
  try {
    console.log("Starting database migration...");
    
    // updateMany(filter, pipeline, options)
    const result = await Order.updateMany(
      { "product.quantity": { $exists: false } }, // 1. Find orders missing the field
      [
        {
          $set: {
            "product.quantity": 1,
            "product.size": "N/A",
            // Use the $ prefix to refer to the value of an existing field
            "product.totalPrice": "$product.productPrice" 
          }
        }
      ]
    );

    console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (err) {
    console.error("Migration error:", err);
  }
}

// Call this after your mongoose.connect() succeeds
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    runMigration(); // Run the migration once
  });
