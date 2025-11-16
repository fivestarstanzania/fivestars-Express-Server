import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI=process.env.MONGO_URI;


export const connectDB = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing!");
    throw new Error("MongoDB URI not provided");
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error; // Let startServer() handle it
  }
};