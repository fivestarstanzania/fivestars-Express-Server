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
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.1.150:3000"
      ],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    },
}); 

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("userConnected", (data) => {
      console.log(`User send us that he connected:`, data);
      // You can store the userId or take any action here
    });

    // Handle different event categories
    
    handleUserEvents(io, socket, userSocketMap);
    handleMessageEvents(io, socket, userSocketMap);
    handleNotificationEvents(io, socket, userSocketMap);
    

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      for (const [key, value] of Object.entries(userSocketMap)) {
        if (value === socket.id) {
          delete userSocketMap[key];
        }
      }
    });
});

export {io, app, server};


// Export utilities
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}
