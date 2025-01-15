import express from "express";
import { getAllContatedUsers, getMessages, getUnreadMessageCount, sendMessage } from "../controllers/messageController.js";
import { validateReceiverId } from "../middleware/validateReceiverId.js";

const router=express.Router();

router.get("/unread", getUnreadMessageCount)

router.get("/users", getAllContatedUsers)

// Route to get messages by roomId
router.get("/:id", getMessages)
//router.get("/:roomId", getMessages);

// Route to send a message
router.post("/send/:id", sendMessage)
//router.post("/send", sendMessage);






export default router;