import { Socket } from "socket.io";
import { io } from "../socket/socket.js";
import User from "../models/User.js";
import Message from "../models/message.js";

export const getAllContatedUsers = async (req, res) => {
    try {
        const myId = req.user._id;

        // Step 1: Find all messages where the user is either the sender or receiver
        const messages = await Message.find({
            $or: [
                { senderId: myId },
                { receiverId: myId },
            ]
        }).sort({ createdAt: -1 });

        // Step 2: Create a map to track the latest message for each contacted user
        const lastMessagesMap = new Map();

        messages.forEach(message => {
            const otherUserId = message.senderId.toString() === myId.toString()
                ? message.receiverId.toString()
                : message.senderId.toString();

            // Only add the first occurrence (latest message) for each user
            if (!lastMessagesMap.has(otherUserId)) {
                lastMessagesMap.set(otherUserId, message);
            }
        });

        // Step 3: Get the IDs of contacted users
        const otherUserIds = Array.from(lastMessagesMap.keys());

        // Step 4: Fetch user details for these IDs
        const users = await User.find({ _id: { $in: otherUserIds } }).select('name _id');

        // Step 5: Construct the result array with user details, last message, and unread count
        const result = await Promise.all(
            users.map(async (user) => {
                const lastMessage = lastMessagesMap.get(user._id.toString());
                const unreadCount = await Message.countDocuments({
                    roomId: [myId, user._id.toString()].sort().join("_"),
                    receiverId: myId,
                    isRead: false,
                });

                return {
                    userId: user._id,
                    username: user.name,
                    lastMessage: lastMessage ? lastMessage.text : null,
                    lastMessageTimestamp: lastMessage ? lastMessage.createdAt : null, // Include the timestamp
                    unreadCount,
                };
            })
        );

        // Step 6: Sort the result array by the newest lastMessage timestamp
        const sortedResult = result.sort((a, b) => {
            if (!a.lastMessageTimestamp) return 1; // If a has no last message, move it to the end
            if (!b.lastMessageTimestamp) return -1; // If b has no last message, move it to the end
            return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp); // Sort descending
        });

        // Step 7: Send the sorted result
        res.status(200).json(sortedResult);
    } catch (error) {
        console.log("Error in getAllContatedUsers controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Controller to fetch the total unread messages count for the logged-in user
export const getUnreadMessageCount = async (req, res) => {
    
    try {
        
        const myId = req.user._id; // Get the logged-in user's ID

        // Step 1: Count all unread messages for the logged-in user
        const unreadCount = await Message.countDocuments({
            receiverId: myId,
            isRead: false, // Only consider unread messages
        });

        // Step 2: Send the unread message count as the response
        res.status(200).json({ unreadCount });
        
    } catch (error) {
       
        res.status(500).json({ message: "Internal server error" });
    }
};



export const getMessages = async(req,res)=>{
    //const { roomId } = req.params;
    //console.log("get Message Called")
    try {
        const {id: userToChatId} = req.params;
        const myId =req.user._id;

        // Ensure the roomId is always the same for the same two users
        const sortedIds = [userToChatId, myId].sort(); // Sort the two IDs alphabetically
        const roomId = sortedIds.join("_"); // Create a roomId by joining sorted IDs with a separator
        // Optional: You can hash the roomId for obfuscation, e.g., crypto.createHash('sha256').update(roomId).digest('hex');

        // Mark all unread messages in this room as read
        await Message.updateMany(
            { roomId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        if (messages.length > 0) { 
            res.status(200).json(messages); 
        }
        else{
            res.status(200).json({ message: "No messages found" });   
        } 
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
}

export const sendMessage = async(req,res)=>{

    try {
        
        const {text, imageUrl} = req.body;
        const {id: receiverId } = req.params;
        const senderId = req.user._id;

        // Ensure the roomId is always the same for the same two users
        const sortedIds = [receiverId, senderId].sort(); // Sort the two IDs alphabetically
        const roomId = sortedIds.join("_"); // Create a roomId by joining sorted IDs with a separator
        // Optional: You can hash the roomId for obfuscation, e.g., crypto.createHash('sha256').update(roomId).digest('hex');
 

        //const { roomId, senderId, receiverId, text } = req.body;

        const newMessage = new Message({
           senderId,
           receiverId,
           text,
           imageUrl,
           roomId
        })

        await newMessage.save();
        io.to(roomId).emit("receiveMessage", { senderId, receiverId, text, timestamp: new Date() })

/*

        //Todo : realtime functionality goes here => socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(roomId).emit("receiveMessage", newMessage);
        }

        // When a message is sent
        socket.on("sendMessage", ({ roomId, senderId, receiverId, message }) => {
            // Broadcast the message to everyone in the room
            io.to(roomId).emit("receiveMessage", { senderId, receiverId, message, timestamp: new Date() });
            console.log(`Message sent to room ${roomId}: ${message}`);
        });
*/
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message)
        res.status(500).json({message:"Internal server error"});
    }
}