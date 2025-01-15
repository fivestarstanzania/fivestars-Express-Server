export const  validateReceiverId=(req, res, next) =>{
    const { receiverId } = req.params;
    if (!isValidObjectId(receiverId)) {
        return res.status(400).json({ message: "Invalid receiverId" });
    }
    next();
}