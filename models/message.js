import mongoose from 'mongoose'; // Explicitly import mongoose

const messageSchema = new mongoose.Schema(
    {
        roomId:{
            type: String, 
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            //type: String,
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            //type: String,
            required: true,
        },
        text: {
            type: String,
            required: true
        },
        imageUrl:{
            type:String,
        },
        isRead: { 
            type: Boolean, 
            default: false 
        },
        //timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
