export function handleUserEvents(io, socket, userSocketMap) {
    // Store userId and socketId
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
    }
  
    // Notify all users of online users
    socket.emit("getOnlineUsers", Object.keys(userSocketMap));
  
    // Join user-specific room
    socket.on("joinRoom", ({ userId }) => {
      if (userId) socket.join(userId);
      console.log(`User ${userId} joined their room.`);
    });
  
    
}
  