
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/ProductModel.js'; // adjust path
dotenv.config();

async function runMigration() {
  try {
     console.log("Starting database migration...");
    
    // Update all products that don't have isActive field (or null)
    const result = await Product.updateMany(
      { $or: [{ isActive: { $exists: false } }, { isActive: null }] },
      { $set: { isActive: true } }
    );

    console.log(`✅ Migration complete. Updated ${result.modifiedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Call this after your mongoose.connect() succeeds
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    runMigration(); // Run the migration once
  });
