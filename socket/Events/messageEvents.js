export function handleMessageEvents(io, socket, userSocketMap) {
    socket.on("sendMessage", ({ roomId, message }) => {
      // Broadcast the message to everyone in the specified room
      io.to(roomId).emit("receiveMessage", { message });
      console.log(`Message sent to room ${roomId}: ${message}`);
    });
}
  