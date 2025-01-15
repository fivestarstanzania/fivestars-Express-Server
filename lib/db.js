import mongoose from "mongoose";
const MONGO_URI=process.env.MONGO_URI;

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log("Database connected");
       
    } catch (error) {
        console.log(error)
    }    
}