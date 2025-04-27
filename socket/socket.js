import { Server } from "socket.io";
import http from "http";
import express from "express"; 


const app = express();
const server = http.createServer(app);

const userSocketMap = {}

const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.1.150:3000",
        "https://fivestars-express-server.onrender.com"
      ],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    },
}); 

// Handle socket connections
io.on("connection", (socket) => {
    //console.log("A user connected:", socket.id);

    // 1. Save user's socket ID when they identify themselves
    socket.on("registerUser", (data) => {
      if (!data || !data.userId) {
        console.error("Invalid registerUser data:", data);
        return;
      }
      const userIdString = data.userId.toString();
      userSocketMap[userIdString] = socket.id;
      //console.log(userSocketMap)
      //console.log(`User ${userIdString} registered with socket ${socket.id}`);  
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      //console.log("A user disconnected:", socket.id);
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
        if (socketId === socket.id) {
          delete userSocketMap[userId];
          break
        }
      }
    });
}); 

export {io, app, server};


export function getReceiverSocketId(userId) {
  return userSocketMap[userId.toString()];
}


