
import mongoose, { model } from "mongoose";

const adminSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default model("Admin", adminSchema);