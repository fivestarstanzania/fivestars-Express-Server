export function handleNotificationEvents(io, socket, userSocketMap) {
    socket.on("sendNotification", ({ receiverId, notification }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveNotification", { notification });
        console.log(`Notification sent to user ${receiverId}: ${notification}`);
      } else {
        console.log(`User ${receiverId} is not online.`);
      }
    });
}
  