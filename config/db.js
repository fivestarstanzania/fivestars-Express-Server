import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI=process.env.MONGO_URI;
export const connectDB = async () => {
    try {
        //const conn = await mongoose.connect(MONGO_URI);
        await mongoose.connect(MONGO_URI)
        console.log("Database connected");
       
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }    
}