
import mongoose, { model } from "mongoose";

const  blacklistSchema = new mongoose.Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); 
export default model("Blacklist",  blacklistSchema);