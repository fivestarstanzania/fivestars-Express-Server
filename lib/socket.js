/*
import { Server } from "socket.io";
import http from "http";
import express from "express"; 
import { handleUserEvents } from "./Events/userEvents.js";
import { handleMessageEvents } from "./Events/messageEvents.js";
import { handleNotificationEvents } from "./Events/notificationEvents.js";

const app = express();
const server = http.createServer(app);
const users = {}; 
const userSocketMap = {}// {userId: socketId}

const io = new Server(server, {
    cors:{
        origin:[ 
            "http://localhost:3000",   // For local development
            "http://192.168.1.150:3000" // For access from your phone
        ],
        methods: ["GET", "POST"], // Define allowed methods
        allowedHeaders: ["Content-Type"], // Optional: Define allowed headers
    },
});

export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}

io.on("connection", (socket)=>{
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    handleUserEvents(io, socket, userSocketMap);
    handleMessageEvents(io, socket, userSocketMap);
    handleNotificationEvents(io, socket, userSocketMap);
    

    socket.emit("getOnlineUsers", Object.keys(userSocketMap));
    // When a user connects, store their user ID
    socket.on("userConnected", ({ userId }) => {
        users[socket.id] = userId;
        console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // When a user joins a specific room
    socket.on("joinRoom", ({ receiverId }) => {
        socket.join(receiverId);
        console.log(`User joined room: ${receiverId}`);
    });


     // When a message is sent
     socket.on("sendMessage", ({message }) => {
        // Broadcast the message to everyone in the room
        socket.broadcast.to(roomId).emit("receiveMessage", {message});
        console.log(`Message sent to room ${roomId}: ${message}`);
    });
    

    socket.on("disconnect", ()=>{
        console.log("A user disconnected", socket.id);
        delete users[socket.id];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    });
});

export {io, app, server};
// Export utilities
export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}
*/